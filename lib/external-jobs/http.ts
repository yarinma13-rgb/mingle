import { ALLOW_ALL, parseRobots, unreachableRobots, type RobotsPolicy } from "@/lib/external-jobs/robots";
import { CRAWLER_ROBOTS_TOKEN, CRAWLER_USER_AGENT } from "@/lib/external-jobs/types";

/**
 * The only way the engine talks to a source. It:
 * - identifies itself with a stable user agent,
 * - checks robots.txt before every request,
 * - spaces requests per host (source setting or Crawl-delay, whichever is slower),
 * - retries transient failures (network, 5xx, 429 with Retry-After),
 * - never retries or works around 401/403, logins or bot challenges.
 */

export class SourceAccessDenied extends Error {
  readonly reason: "robots" | "forbidden" | "challenge" | "login";
  constructor(reason: SourceAccessDenied["reason"], message: string) {
    super(message);
    this.name = "SourceAccessDenied";
    this.reason = reason;
  }
}

export class SourceTransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceTransientError";
  }
}

export type FetchResult = {
  status: number;
  url: string;
  body: string;
  contentType: string;
};

const TIMEOUT_MS = 15_000;
const MAX_BODY_BYTES = 4_000_000;
const MAX_ATTEMPTS = 3;
const MAX_RETRY_AFTER_MS = 60_000;
const MAX_REDIRECTS = 5;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function looksLikeBotChallenge(body: string): boolean {
  const sample = body.slice(0, 6000).toLowerCase();
  return (
    sample.includes("cf-browser-verification") ||
    sample.includes("cf-challenge") ||
    sample.includes("checking your browser") ||
    sample.includes("attention required! | cloudflare") ||
    sample.includes("radware page") ||
    sample.includes("g-recaptcha") ||
    sample.includes("h-captcha") ||
    (sample.includes("captcha") && sample.includes("challenge"))
  );
}

export function looksLikeLoginWall(body: string, finalUrl: string): boolean {
  if (/\/(login|signin|sign-in|authwall)\b/i.test(finalUrl)) return true;
  const sample = body.slice(0, 6000).toLowerCase();
  return sample.includes('type="password"') && sample.includes("sign in");
}

export class PoliteFetcher {
  private readonly minIntervalMs: number;
  private readonly deadline: number | null;
  private readonly robots = new Map<string, Promise<RobotsPolicy>>();
  private readonly nextSlot = new Map<string, number>();
  requests = 0;

  constructor(opts: { minIntervalMs: number; deadline?: number }) {
    this.minIntervalMs = opts.minIntervalMs;
    this.deadline = opts.deadline ?? null;
  }

  /** True once the run's time budget is spent; connectors stop paging and report an incomplete list. */
  outOfTime(): boolean {
    return this.deadline != null && Date.now() > this.deadline;
  }

  async robotsFor(url: URL): Promise<RobotsPolicy> {
    const origin = url.origin;
    let pending = this.robots.get(origin);
    if (!pending) {
      pending = this.loadRobots(origin);
      this.robots.set(origin, pending);
    }
    return pending;
  }

  private async loadRobots(origin: string): Promise<RobotsPolicy> {
    try {
      await this.throttle(new URL(origin).host, null);
      const response = await fetch(`${origin}/robots.txt`, {
        headers: { "User-Agent": CRAWLER_USER_AGENT, Accept: "text/plain" },
        redirect: "follow",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      this.requests += 1;
      // RFC 9309: 4xx means "no restrictions"; 5xx / unreachable means
      // assume full disallow until it can be read.
      if (response.status >= 400 && response.status < 500) return ALLOW_ALL;
      if (!response.ok) return unreachableRobots(`robots.txt returned ${response.status}`);
      return parseRobots(await response.text(), CRAWLER_ROBOTS_TOKEN);
    } catch (error) {
      const cause = (error as { cause?: { message?: string } })?.cause?.message;
      return unreachableRobots(
        `robots.txt unreachable (${cause ?? (error instanceof Error ? error.message : "network error")})`,
      );
    }
  }

  async isAllowed(rawUrl: string): Promise<boolean> {
    const url = new URL(rawUrl);
    const policy = await this.robotsFor(url);
    return policy.isAllowed(url.pathname + url.search);
  }

  /**
   * "allowed" / "disallowed" by robots.txt, or "unreachable" when it could
   * not be read (treated as a temporary failure, never as a ban).
   */
  async robotsStatus(rawUrl: string): Promise<
    { state: "allowed" | "disallowed" } | { state: "unreachable"; reason: string }
  > {
    const url = new URL(rawUrl);
    const policy = await this.robotsFor(url);
    if (policy.unreachable) return { state: "unreachable", reason: `${url.host}: ${policy.unreachable}` };
    return { state: policy.isAllowed(url.pathname + url.search) ? "allowed" : "disallowed" };
  }

  private async throttle(host: string, crawlDelaySeconds: number | null) {
    const interval = Math.max(this.minIntervalMs, (crawlDelaySeconds ?? 0) * 1000);
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot.get(host) ?? 0);
    this.nextSlot.set(host, slot + interval);
    if (slot > now) await sleep(slot - now);
  }

  async get(rawUrl: string, opts?: { accept?: string }): Promise<FetchResult> {
    // Redirects are followed by hand so robots.txt and the rate limit apply
    // to every hop, including a redirect to another host.
    let url = new URL(rawUrl);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await this.fetchOne(url, opts?.accept);
      const location = response.headers.get("location");
      if (response.status >= 300 && response.status < 400 && location) {
        await response.body?.cancel();
        url = new URL(location, url);
        continue;
      }

      const buffer = await response.arrayBuffer();
      const body = new TextDecoder().decode(buffer.slice(0, MAX_BODY_BYTES));
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("html") && looksLikeBotChallenge(body)) {
        throw new SourceAccessDenied(
          "challenge",
          `${url.host} served a bot challenge / CAPTCHA. Collection stopped; it is never bypassed.`,
        );
      }
      if (contentType.includes("html") && looksLikeLoginWall(body, url.toString())) {
        throw new SourceAccessDenied("login", `${url.host} requires a login. Not collected.`);
      }
      return { status: response.status, url: url.toString(), body, contentType };
    }
    throw new SourceTransientError(`Too many redirects from ${rawUrl}`);
  }

  /** One request (no redirect following), with robots check, throttle and retries. */
  private async fetchOne(url: URL, accept: string | undefined): Promise<Response> {
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new SourceAccessDenied("forbidden", `Unsupported protocol for ${url.toString()}`);
    }
    const policy = await this.robotsFor(url);
    if (policy.unreachable) {
      throw new SourceTransientError(`${url.host}: ${policy.unreachable}; not fetching until it can be read`);
    }
    if (!policy.isAllowed(url.pathname + url.search)) {
      throw new SourceAccessDenied("robots", `robots.txt disallows ${url.host}${url.pathname}`);
    }

    let lastError = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1 && this.outOfTime()) break;
      await this.throttle(url.host, policy.crawlDelay);
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            "User-Agent": CRAWLER_USER_AGENT,
            Accept: accept ?? "application/json, text/html;q=0.9, */*;q=0.5",
          },
          redirect: "manual",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        this.requests += 1;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "network error";
        await sleep(1000 * 2 ** (attempt - 1));
        continue;
      }

      if (response.status === 401 || response.status === 403) {
        throw new SourceAccessDenied(
          "forbidden",
          `${url.host} refused access (${response.status}). Not retrying.`,
        );
      }
      if (response.status === 429 || response.status >= 500) {
        lastError = `${url.host} responded ${response.status}`;
        await response.body?.cancel();
        const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
        const wait = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
          : 1000 * 2 ** attempt;
        // Back off for the whole host, not just this request.
        this.nextSlot.set(url.host, Date.now() + wait);
        continue;
      }
      return response;
    }
    throw new SourceTransientError(lastError || `Could not reach ${url.host}`);
  }

  async getJson<T>(rawUrl: string): Promise<{ status: number; data: T | null }> {
    const result = await this.get(rawUrl, { accept: "application/json" });
    if (result.status >= 400) return { status: result.status, data: null };
    try {
      return { status: result.status, data: JSON.parse(result.body) as T };
    } catch {
      throw new SourceTransientError(`Invalid JSON from ${new URL(rawUrl).host}`);
    }
  }
}
