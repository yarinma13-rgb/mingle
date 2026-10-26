import { ALLOW_ALL, DISALLOW_ALL, parseRobots, type RobotsPolicy } from "@/lib/external-jobs/robots";
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
  private readonly robots = new Map<string, Promise<RobotsPolicy>>();
  private readonly nextSlot = new Map<string, number>();
  requests = 0;

  constructor(opts: { minIntervalMs: number }) {
    this.minIntervalMs = opts.minIntervalMs;
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
      if (!response.ok) return DISALLOW_ALL;
      return parseRobots(await response.text(), CRAWLER_ROBOTS_TOKEN);
    } catch {
      return DISALLOW_ALL;
    }
  }

  async isAllowed(rawUrl: string): Promise<boolean> {
    const url = new URL(rawUrl);
    const policy = await this.robotsFor(url);
    return policy.isAllowed(url.pathname + url.search);
  }

  private async throttle(host: string, crawlDelaySeconds: number | null) {
    const interval = Math.max(this.minIntervalMs, (crawlDelaySeconds ?? 0) * 1000);
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot.get(host) ?? 0);
    this.nextSlot.set(host, slot + interval);
    if (slot > now) await sleep(slot - now);
  }

  async get(rawUrl: string, opts?: { accept?: string }): Promise<FetchResult> {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new SourceAccessDenied("forbidden", `Unsupported protocol for ${rawUrl}`);
    }
    const policy = await this.robotsFor(url);
    if (!policy.isAllowed(url.pathname + url.search)) {
      throw new SourceAccessDenied("robots", `robots.txt disallows ${url.pathname}`);
    }

    let lastError = "";
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await this.throttle(url.host, policy.crawlDelay);
      let response: Response;
      try {
        response = await fetch(url, {
          headers: {
            "User-Agent": CRAWLER_USER_AGENT,
            Accept: opts?.accept ?? "application/json, text/html;q=0.9, */*;q=0.5",
          },
          redirect: "follow",
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
        const retryAfter = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
        const wait = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, MAX_RETRY_AFTER_MS)
          : 1000 * 2 ** attempt;
        // Back off for the whole host, not just this request.
        this.nextSlot.set(url.host, Date.now() + wait);
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
      if (contentType.includes("html") && looksLikeLoginWall(body, response.url)) {
        throw new SourceAccessDenied("login", `${url.host} requires a login. Not collected.`);
      }
      return { status: response.status, url: response.url || url.toString(), body, contentType };
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
