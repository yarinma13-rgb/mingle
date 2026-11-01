import { decodeHtmlEntities } from "@/lib/roles/html-text";
import {
  htmlToText,
  inferEmploymentType,
  inferWorkModel,
  isoOrNull,
  joinLocation,
  type Connector,
} from "@/lib/external-jobs/connectors/common";
import { SourceAccessDenied } from "@/lib/external-jobs/http";
import type { RawJob } from "@/lib/external-jobs/types";

/*
 * For companies that host their own careers site: read the sitemap the
 * company publishes for crawlers, then only the schema.org JobPosting
 * structured data embedded in each job page — the markup companies add
 * precisely so job aggregators (e.g. Google for Jobs) can index the job.
 * robots.txt is checked for the sitemap and for every page.
 */

const MAX_PAGES_PER_RUN = 60;
const MAX_CHILD_SITEMAPS = 5;

export function sitemapLocations(xml: string): { urls: string[]; childSitemaps: string[] } {
  const isIndex = /<sitemapindex[\s>]/i.test(xml);
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) =>
    decodeHtmlEntities(m[1]).trim(),
  );
  return isIndex ? { urls: [], childSitemaps: locs } : { urls: locs, childSitemaps: [] };
}

type JsonLdPosting = Record<string, unknown>;

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findPostings(node: unknown, out: JsonLdPosting[]) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    node.forEach((child) => findPostings(child, out));
    return;
  }
  const record = node as Record<string, unknown>;
  const type = record["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
    out.push(record);
    return;
  }
  if (record["@graph"]) findPostings(record["@graph"], out);
}

export function extractJobPostings(html: string): JsonLdPosting[] {
  const out: JsonLdPosting[] = [];
  for (const block of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      findPostings(JSON.parse(block[1].trim()), out);
    } catch {
      // ignore malformed JSON-LD
    }
  }
  return out;
}

function postingLocation(posting: JsonLdPosting): string | null {
  for (const place of asArray(posting.jobLocation as unknown)) {
    const address = (place as { address?: Record<string, unknown> })?.address;
    if (address && typeof address === "object") {
      const loc = joinLocation(
        str(address.addressLocality),
        str(address.addressRegion),
        str((address.addressCountry as { name?: string })?.name ?? address.addressCountry),
      );
      if (loc) return loc;
    }
  }
  return null;
}

/** Turns one JobPosting into a RawJob, or null if it is expired / unusable. */
export function postingToRawJob(
  posting: JsonLdPosting,
  pageUrl: string,
  fallbackCompany: string,
  now = new Date(),
): RawJob | null {
  const title = str(posting.title);
  const description = str(posting.description);
  if (!title || !description) return null;

  const validThrough = isoOrNull(posting.validThrough);
  if (validThrough && new Date(validThrough) < now) return null;

  const identifier = posting.identifier as { value?: unknown } | string | undefined;
  const externalId =
    (typeof identifier === "object" ? str(String(identifier?.value ?? "")) : str(identifier)) ??
    pageUrl;
  const org = posting.hiringOrganization as { name?: unknown } | undefined;
  const locationType = asArray(posting.jobLocationType as string | string[]).join(" ");

  return {
    externalId,
    title,
    companyName: str(org?.name) ?? fallbackCompany,
    location: postingLocation(posting),
    workModelHint: inferWorkModel(/TELECOMMUTE/i.test(locationType) ? "remote" : null),
    employmentTypeHint: inferEmploymentType(asArray(posting.employmentType as string).join(" ")),
    department: null,
    text: htmlToText(description),
    applyUrl: str(posting.url) ?? pageUrl,
    sourceUrl: pageUrl,
    postedAt: isoOrNull(posting.datePosted),
    updatedAt: null,
    countries: asArray(posting.jobLocation as unknown)
      .map((place) => (place as { address?: Record<string, unknown> })?.address?.addressCountry)
      .map((c) => str((c as { name?: string })?.name ?? c))
      .filter((c): c is string => Boolean(c)),
    payload: { validThrough, identifier: posting.identifier, employmentType: posting.employmentType },
  };
}

export const jsonldSitemap: Connector = {
  endpoint: (source) => source.source_key,
  async list(source, fetcher) {
    const careersPrefix = new URL(source.careers_url);
    const root = await fetcher.get(source.source_key, { accept: "application/xml, text/xml" });
    if (root.status >= 400) {
      throw new SourceAccessDenied("forbidden", `Sitemap returned ${root.status}`);
    }

    const parsed = sitemapLocations(root.body);
    let urls = parsed.urls;
    const childSitemaps = parsed.childSitemaps;
    for (const child of childSitemaps.slice(0, MAX_CHILD_SITEMAPS)) {
      const response = await fetcher.get(child, { accept: "application/xml, text/xml" });
      if (response.status < 400) urls = urls.concat(sitemapLocations(response.body).urls);
    }

    // Only pages under the careers site the admin approved.
    const candidates = [...new Set(urls)].filter((url) => {
      try {
        const parsed = new URL(url);
        return (
          parsed.host === careersPrefix.host &&
          parsed.pathname.startsWith(careersPrefix.pathname.replace(/\/$/, "")) &&
          parsed.pathname.replace(/\/$/, "") !== careersPrefix.pathname.replace(/\/$/, "")
        );
      } catch {
        return false;
      }
    });

    const jobs: RawJob[] = [];
    let visited = 0;
    for (const url of candidates) {
      if (visited >= MAX_PAGES_PER_RUN || fetcher.outOfTime()) break;
      if (!(await fetcher.isAllowed(url))) continue;
      visited += 1;
      const page = await fetcher.get(url, { accept: "text/html" });
      if (page.status >= 400) continue;
      for (const posting of extractJobPostings(page.body)) {
        const job = postingToRawJob(posting, page.url, source.company_name);
        if (job) jobs.push(job);
      }
    }
    return { jobs, complete: visited >= candidates.length };
  },
};
