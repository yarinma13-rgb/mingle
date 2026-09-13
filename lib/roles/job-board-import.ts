import { extractRoleFromJd, looksLikeUrl } from "@/lib/roles/extract-jd";
import type { RoleDraft } from "@/lib/roles/persistence";
import {
  decodeHtmlEntities,
  documentTitle,
  elementById,
  extractJsonLdJobPosting,
  firstHeading,
  firstMatchHtml,
  metaContent,
  stripTags,
} from "@/lib/roles/html-text";

export type JobBoardHost = "alljobs" | "drushim" | "jobmaster";

export type ParsedJobBoardJd = {
  host: JobBoardHost;
  title: string;
  description: string;
  requirements: string;
  rawText: string;
  sourceUrl: string;
};

export type JobBoardImportErrorCode =
  | "invalid_url"
  | "unsupported_host"
  | "linkedin"
  | "fetch_failed"
  | "blocked"
  | "empty"
  | "gone";

export class JobBoardImportError extends Error {
  readonly code: JobBoardImportErrorCode;

  constructor(code: JobBoardImportErrorCode, message: string) {
    super(message);
    this.name = "JobBoardImportError";
    this.code = code;
  }
}

const MANUAL_PASTE_HINT =
  "Paste the job description as text instead, then try again.";

const ALLOWED_SUFFIXES = [
  "alljobs.co.il",
  "drushim.co.il",
  "jobmaster.co.il",
] as const;

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 1_500_000;

function hostMatches(hostname: string, suffix: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === suffix || host.endsWith(`.${suffix}`);
}

export function resolveJobBoardHost(url: URL): JobBoardHost | null {
  const hostname = url.hostname.toLowerCase();
  if (hostname.includes("linkedin.")) return null;
  if (hostMatches(hostname, "alljobs.co.il")) return "alljobs";
  if (hostMatches(hostname, "drushim.co.il")) return "drushim";
  if (hostMatches(hostname, "jobmaster.co.il")) return "jobmaster";
  return null;
}

export function isAllowedJobBoardUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return resolveJobBoardHost(url) != null;
  } catch {
    return false;
  }
}

export function assertImportableJobBoardUrl(raw: string): {
  url: URL;
  host: JobBoardHost;
} {
  const trimmed = raw.trim();
  if (!looksLikeUrl(trimmed)) {
    throw new JobBoardImportError(
      "invalid_url",
      `That does not look like a valid http(s) URL. ${MANUAL_PASTE_HINT}`,
    );
  }
  const url = new URL(trimmed);
  const hostname = url.hostname.toLowerCase();
  if (hostname.includes("linkedin.")) {
    throw new JobBoardImportError(
      "linkedin",
      `LinkedIn job links are not supported. ${MANUAL_PASTE_HINT}`,
    );
  }
  const host = resolveJobBoardHost(url);
  if (!host) {
    const allowed = ALLOWED_SUFFIXES.join(", ");
    throw new JobBoardImportError(
      "unsupported_host",
      `Only ${allowed} links are supported (including common subdomains). ${MANUAL_PASTE_HINT}`,
    );
  }
  return { url, host };
}

function looksBlocked(html: string): boolean {
  const sample = html.slice(0, 4000).toLowerCase();
  return (
    sample.includes("radware page") ||
    sample.includes("attention required") ||
    sample.includes("cf-browser-verification") ||
    sample.includes("checking your browser") ||
    (sample.includes("captcha") && sample.includes("challenge"))
  );
}

function looksGone(html: string, status: number): boolean {
  if (status === 404 || status === 410) {
    const text = stripTags(html).toLowerCase();
    if (
      /page you requested was removed|not found|isgone|משרה לא נמצאה|המשרה הוסרה|לא קיימת/.test(
        text,
      ) ||
      html.length < 200
    ) {
      return true;
    }
  }
  if (/["']isGone["']\s*:\s*true/.test(html)) return true;
  if (/job-content-top-title-not-actual/.test(html) && html.length < 50_000) {
    // AllJobs often still embeds similar jobs; treat as gone only when the
    // target job box has no description body.
    return false;
  }
  return false;
}

function joinSections(
  title: string,
  description: string,
  requirements: string,
): string {
  const parts: string[] = [];
  if (title.trim()) parts.push(title.trim());
  if (description.trim()) {
    parts.push(`Description:\n${description.trim()}`);
  }
  if (requirements.trim()) {
    parts.push(`Requirements:\n${requirements.trim()}`);
  }
  return parts.join("\n\n").trim();
}

function cleanTitle(value: string): string {
  return value
    .replace(/\s*[|\-–]\s*(AllJobs|דרושים|jobMaster|JobMaster).*$/i, "")
    .replace(/\s*\|?\s*משרה\s+\d+\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function parseAllJobs(html: string, sourceUrl: string): ParsedJobBoardJd {
  const url = new URL(sourceUrl);
  const jobId =
    url.searchParams.get("JobID") ||
    url.searchParams.get("jobId") ||
    url.pathname.match(/\/jobs\/(\d+)/i)?.[1] ||
    "";

  let title = "";
  let description = "";
  let requirements = "";

  if (jobId) {
    const box =
      elementById(html, `job-box-container${jobId}`) ||
      elementById(html, `job-body-content${jobId}`) ||
      "";
    const scope = box || html;
    title =
      stripTags(
        firstMatchHtml(
          scope,
          new RegExp(
            `href=["'][^"']*JobID=${jobId}[^"']*["'][^>]*>\\s*<h[12][^>]*>([\\s\\S]*?)</h[12]>`,
            "i",
          ),
        ),
      ) ||
      stripTags(
        firstMatchHtml(scope, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
      ) ||
      stripTags(
        firstMatchHtml(scope, /<h2[^>]*>([\s\S]*?)<\/h2>/i),
      );

    const descHtml = firstMatchHtml(
      scope,
      /class=["'][^"']*job-content-top-desc[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<div class=["']job-content-top-desc/,
    );
    const combined = stripTags(descHtml);
    if (combined) {
      const split = combined.split(/דרישות\s*:|Requirements\s*:/i);
      description = (split[0] ?? "").trim();
      requirements = (split[1] ?? "").trim();
    }
  }

  if (!title) {
    title =
      cleanTitle(metaContent(html, "og:title")) ||
      cleanTitle(documentTitle(html)) ||
      firstHeading(html);
  }
  if (!description) {
    const ld = extractJsonLdJobPosting(html);
    if (ld?.description) description = ld.description;
    if (!title && ld?.title) title = ld.title;
  }

  const rawText = joinSections(title, description, requirements);
  if (!rawText) {
    throw new JobBoardImportError(
      "empty",
      `We could not read that AllJobs listing. ${MANUAL_PASTE_HINT}`,
    );
  }

  return {
    host: "alljobs",
    title: cleanTitle(title),
    description,
    requirements,
    rawText,
    sourceUrl,
  };
}

function parseDrushimNextData(html: string): {
  title: string;
  description: string;
  requirements: string;
  gone: boolean;
} | null {
  const match = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match?.[1]) return null;
  try {
    const data = JSON.parse(match[1]) as {
      props?: {
        pageProps?: {
          isGone?: boolean;
          job?: {
            title?: string;
            description?: string | string[];
            requirements?: string | string[];
          } | null;
        };
      };
    };
    const pageProps = data.props?.pageProps;
    if (!pageProps) return null;
    if (pageProps.isGone || !pageProps.job) {
      return { title: "", description: "", requirements: "", gone: true };
    }
    const job = pageProps.job;
    const description = Array.isArray(job.description)
      ? job.description.join("\n")
      : (job.description ?? "");
    const requirements = Array.isArray(job.requirements)
      ? job.requirements.join("\n")
      : (job.requirements ?? "");
    return {
      title: job.title?.trim() ?? "",
      description: stripTags(description),
      requirements: stripTags(requirements),
      gone: false,
    };
  } catch {
    return null;
  }
}

function parseDrushim(html: string, sourceUrl: string): ParsedJobBoardJd {
  const fromNext = parseDrushimNextData(html);
  if (fromNext?.gone) {
    throw new JobBoardImportError(
      "gone",
      `That Drushim job is no longer available. ${MANUAL_PASTE_HINT}`,
    );
  }

  let title = fromNext?.title ?? "";
  let description = fromNext?.description ?? "";
  let requirements = fromNext?.requirements ?? "";

  if (!title || !description) {
    const ld = extractJsonLdJobPosting(html);
    if (!title && ld?.title) title = ld.title;
    if (!description && ld?.description) description = ld.description;
  }

  if (!title) {
    title =
      cleanTitle(metaContent(html, "og:title")) ||
      cleanTitle(documentTitle(html));
  }

  const rawText = joinSections(title, description, requirements);
  if (!rawText) {
    throw new JobBoardImportError(
      "empty",
      `We could not read that Drushim listing. ${MANUAL_PASTE_HINT}`,
    );
  }

  return {
    host: "drushim",
    title: cleanTitle(title),
    description,
    requirements,
    rawText,
    sourceUrl,
  };
}

function parseJobMaster(html: string, sourceUrl: string): ParsedJobBoardJd {
  const title =
    cleanTitle(metaContent(html, "og:title")) ||
    cleanTitle(
      stripTags(
        firstMatchHtml(
          html,
          /class=["'][^"']*jobHead__text__title[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/i,
        ),
      ),
    ) ||
    cleanTitle(documentTitle(html)) ||
    firstHeading(html);

  const description = stripTags(elementById(html, "jobDescriptionContent"));
  const requirements = stripTags(elementById(html, "jobRequirementsContent"));

  let fallbackDescription = description;
  if (!fallbackDescription) {
    fallbackDescription =
      metaContent(html, "og:description") ||
      metaContent(html, "description") ||
      extractJsonLdJobPosting(html)?.description ||
      "";
  }

  const rawText = joinSections(title, fallbackDescription, requirements);
  if (!rawText) {
    throw new JobBoardImportError(
      "empty",
      `We could not read that JobMaster listing. ${MANUAL_PASTE_HINT}`,
    );
  }

  return {
    host: "jobmaster",
    title: cleanTitle(title),
    description: fallbackDescription,
    requirements,
    rawText,
    sourceUrl,
  };
}

export function parseJobBoardHtml(
  html: string,
  sourceUrl: string,
  host: JobBoardHost,
): ParsedJobBoardJd {
  const normalized = decodeHtmlEntities(html);
  switch (host) {
    case "alljobs":
      return parseAllJobs(normalized, sourceUrl);
    case "drushim":
      return parseDrushim(normalized, sourceUrl);
    case "jobmaster":
      return parseJobMaster(normalized, sourceUrl);
    default: {
      const _exhaustive: never = host;
      return _exhaustive;
    }
  }
}

export async function fetchJobBoardHtml(url: URL): Promise<{
  html: string;
  finalUrl: string;
  status: number;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent":
          "Mozilla/5.0 (compatible; mingle-jd-import/1.0; +https://mingle.careers)",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml|text\/plain/i.test(contentType)
    ) {
      throw new JobBoardImportError(
        "fetch_failed",
        `That URL did not return a job page. ${MANUAL_PASTE_HINT}`,
      );
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_HTML_BYTES) {
      throw new JobBoardImportError(
        "fetch_failed",
        `That job page is too large to import. ${MANUAL_PASTE_HINT}`,
      );
    }
    const html = new TextDecoder("utf-8").decode(buffer);
    return {
      html,
      finalUrl: response.url || url.toString(),
      status: response.status,
    };
  } catch (caught) {
    if (caught instanceof JobBoardImportError) throw caught;
    throw new JobBoardImportError(
      "fetch_failed",
      `We could not open that link. ${MANUAL_PASTE_HINT}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

export function parsedJdToRoleDraft(parsed: ParsedJobBoardJd): RoleDraft {
  const draft = extractRoleFromJd(parsed.rawText, parsed.sourceUrl);
  if (parsed.title.trim()) {
    draft.title = parsed.title.trim();
  }
  if (parsed.requirements) {
    const fromReqs = extractRoleFromJd(parsed.requirements).requiredSkills;
    const merged = [...draft.requiredSkills];
    for (const skill of fromReqs) {
      if (!merged.includes(skill) && merged.length < 5) merged.push(skill);
    }
    draft.requiredSkills = merged;
  }
  return draft;
}

export async function importRoleFromJobBoardUrl(
  rawUrl: string,
): Promise<RoleDraft> {
  const { url, host } = assertImportableJobBoardUrl(rawUrl);
  const { html, finalUrl, status } = await fetchJobBoardHtml(url);

  if (looksBlocked(html)) {
    throw new JobBoardImportError(
      "blocked",
      `The job site blocked the import. ${MANUAL_PASTE_HINT}`,
    );
  }

  // Re-check host after redirects (still must stay on allowlist).
  let effectiveHost = host;
  try {
    const finalParsed = new URL(finalUrl);
    const redirected = resolveJobBoardHost(finalParsed);
    if (!redirected) {
      throw new JobBoardImportError(
        "unsupported_host",
        `That link redirected off the supported job boards. ${MANUAL_PASTE_HINT}`,
      );
    }
    effectiveHost = redirected;
  } catch (caught) {
    if (caught instanceof JobBoardImportError) throw caught;
  }

  if (looksGone(html, status)) {
    throw new JobBoardImportError(
      "gone",
      `That job listing looks removed or expired. ${MANUAL_PASTE_HINT}`,
    );
  }

  if (!html.trim()) {
    throw new JobBoardImportError(
      "empty",
      `We could not read that job page. ${MANUAL_PASTE_HINT}`,
    );
  }

  const parsed = parseJobBoardHtml(html, finalUrl || url.toString(), effectiveHost);
  return parsedJdToRoleDraft(parsed);
}
