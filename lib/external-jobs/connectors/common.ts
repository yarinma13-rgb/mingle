import { stripTags, decodeHtmlEntities } from "@/lib/roles/html-text";
import type { PoliteFetcher } from "@/lib/external-jobs/http";
import type {
  ExternalEmploymentType,
  ExternalSourceRow,
  RawJob,
  WorkModel,
} from "@/lib/external-jobs/types";

export type ConnectorResult = {
  jobs: RawJob[];
  /**
   * True when `jobs` is the source's full list of open jobs. Only then may a
   * job missing from the list be treated as a closure candidate.
   */
  complete: boolean;
};

export type Connector = {
  /** Where the connector reads from, for the admin UI and the permission check. */
  endpoint(source: ExternalSourceRow): string;
  list(source: ExternalSourceRow, fetcher: PoliteFetcher): Promise<ConnectorResult>;
};

/** Hard cap so one huge board can't eat the whole run. */
export const MAX_JOBS_PER_SOURCE = 150;

export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";
  // Some APIs (Greenhouse) return entity-escaped HTML.
  const decoded = /&lt;[a-z]/i.test(html) ? decodeHtmlEntities(html) : html;
  return stripTags(decoded.replace(/<li[^>]*>/gi, "\n• "));
}

export function inferWorkModel(...hints: Array<string | null | undefined | boolean>): WorkModel | null {
  const text = hints
    .map((h) => (typeof h === "boolean" ? (h ? "remote" : "") : (h ?? "")))
    .join(" ")
    .toLowerCase();
  if (/\bhybrid\b|היברידי/.test(text)) return "Hybrid";
  if (/\bremote\b|telecommute|work from home|מהבית|מרחוק/.test(text)) return "Remote";
  if (/on-?site|in office|office based|onsite|במשרד/.test(text)) return "Office based";
  return null;
}

export function inferEmploymentType(value: string | null | undefined): ExternalEmploymentType | null {
  const text = (value ?? "").toLowerCase().replace(/[\s_-]+/g, "");
  if (!text) return null;
  if (text.includes("intern")) return "internship";
  if (text.includes("parttime") || text.includes("חלקית")) return "part_time";
  if (text.includes("fulltime") || text.includes("מלאה") || text === "permanent") return "full_time";
  if (text.includes("freelance")) return "freelance";
  if (text.includes("contract") || text.includes("contractor")) return "contract";
  if (text.includes("temp")) return "temporary";
  return null;
}

export function isoOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function joinLocation(...parts: Array<string | null | undefined>): string | null {
  const joined = parts.map((p) => (p ?? "").trim()).filter(Boolean);
  return joined.length ? [...new Set(joined)].join(", ") : null;
}
