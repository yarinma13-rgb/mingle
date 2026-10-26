import { createHash } from "node:crypto";
import type { ProcessedJob, RawJob } from "@/lib/external-jobs/types";

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeForKey(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\b(ltd|inc|llc|gmbh|bv|plc|corp|co)\b\.?/g, " ")
    .replace(/\((m|f|d|w)\/(m|f|d|w)(\/(m|f|d|w))?\)/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Cross-source duplicate key. The same role posted on a company's Greenhouse
 * board and its sitemap, or re-posted with a new id, maps to one fingerprint.
 */
export function jobFingerprint(input: {
  companyName: string;
  title: string;
  location: string | null;
}): string {
  const location = normalizeForKey(input.location).split(" ").slice(0, 3).join(" ");
  return sha256(
    [normalizeForKey(input.companyName), normalizeForKey(input.title), location].join("|"),
  ).slice(0, 40);
}

/** Changes only when the source content a candidate would see changes. */
export function rawContentHash(job: RawJob): string {
  return sha256(
    JSON.stringify([
      job.title,
      job.location,
      job.workModelHint,
      job.employmentTypeHint,
      job.department,
      job.text.replace(/\s+/g, " ").trim(),
      job.applyUrl,
    ]),
  );
}

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter(Boolean);
}

export function processedText(job: ProcessedJob): string {
  return [
    job.summary,
    ...job.responsibilities,
    ...job.requirements,
    ...job.niceToHave,
  ].join("\n");
}

export type CopyAnalysis = {
  /** Share of the rewrite's 8-word shingles that appear verbatim in the source. */
  shingleOverlap: number;
  /** Longest run of consecutive words copied from the source. */
  longestCopiedRun: number;
};

const SHINGLE = 8;

/**
 * Detects verbatim copying of the source description. Short shared phrases
 * ("5+ years of experience with React") are normal; long copied runs and a
 * high share of copied 8-word windows are not.
 */
export function analyzeCopying(source: string, rewrite: string): CopyAnalysis {
  const src = words(source);
  const out = words(rewrite);
  if (out.length < SHINGLE || src.length < SHINGLE) {
    return { shingleOverlap: 0, longestCopiedRun: 0 };
  }

  const srcShingles = new Set<string>();
  for (let i = 0; i + SHINGLE <= src.length; i++) {
    srcShingles.add(src.slice(i, i + SHINGLE).join(" "));
  }
  let copied = 0;
  let total = 0;
  for (let i = 0; i + SHINGLE <= out.length; i++) {
    total += 1;
    if (srcShingles.has(out.slice(i, i + SHINGLE).join(" "))) copied += 1;
  }

  // Longest common word run via rolling DP over two rows.
  let longest = 0;
  let prev = new Array<number>(src.length + 1).fill(0);
  for (let i = 1; i <= out.length; i++) {
    const row = new Array<number>(src.length + 1).fill(0);
    for (let j = 1; j <= src.length; j++) {
      if (out[i - 1] === src[j - 1]) {
        row[j] = prev[j - 1] + 1;
        if (row[j] > longest) longest = row[j];
      }
    }
    prev = row;
  }

  return {
    shingleOverlap: total > 0 ? copied / total : 0,
    longestCopiedRun: longest,
  };
}

/** Numbers (years, salaries, percentages) in the rewrite that the source never mentions. */
export function unsupportedNumbers(source: string, rewrite: string): string[] {
  const sourceNumbers = new Set(source.match(/\d+(?:[.,]\d+)?/g) ?? []);
  const found = rewrite.match(/\d+(?:[.,]\d+)?/g) ?? [];
  return [...new Set(found.filter((n) => !sourceNumbers.has(n)))];
}

const MONEY_PATTERN =
  /(?:[$€£₪]\s?\d)|(?:\d\s?(?:k|K)\b)|\b(?:salary|compensation|equity|stock options|bonus|שכר|משכורת)\b/i;
const BENEFIT_PATTERN =
  /\b(?:benefits?|perks?|health insurance|pension|401k|paid time off|pto|gym|hybrid stipend|הטבות|קרן השתלמות|ביטוח)\b/i;

/** Salary or benefit claims present in the rewrite but absent from the source. */
export function inventedTermsClaims(source: string, rewrite: string): string[] {
  const issues: string[] = [];
  if (MONEY_PATTERN.test(rewrite) && !MONEY_PATTERN.test(source)) {
    issues.push("mentions pay/compensation the source does not state");
  }
  if (BENEFIT_PATTERN.test(rewrite) && !BENEFIT_PATTERN.test(source)) {
    issues.push("mentions benefits the source does not state");
  }
  return issues;
}

const PARTNERSHIP_PATTERN =
  /\b(?:official partner|partnered with mingle|in partnership with mingle|mingle partner|apply (?:on|via|through) mingle|hiring on mingle)\b/i;

export function impliesPartnership(text: string): boolean {
  return PARTNERSHIP_PATTERN.test(text);
}

export function hostOf(value: string): string | null {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function hostMatchesAny(host: string, allowed: string[]): boolean {
  return allowed.some((suffix) => {
    const clean = suffix.toLowerCase().replace(/^www\./, "").trim();
    return clean !== "" && (host === clean || host.endsWith(`.${clean}`));
  });
}

export function cleanList(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.replace(/\s+/g, " ").trim();
    if (trimmed && !out.includes(trimmed)) out.push(trimmed);
    if (out.length >= max) break;
  }
  return out;
}
