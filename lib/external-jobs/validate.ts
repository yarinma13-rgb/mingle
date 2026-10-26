import type { FactCheck } from "@/lib/external-jobs/ai";
import { ATS_APPLY_HOSTS } from "@/lib/external-jobs/connectors";
import {
  analyzeCopying,
  hostMatchesAny,
  hostOf,
  impliesPartnership,
  inventedTermsClaims,
  processedText,
  unsupportedNumbers,
} from "@/lib/external-jobs/text";
import type { ExternalSourceRow, ProcessedJob, RawJob } from "@/lib/external-jobs/types";

export type ValidationCheckId =
  | "source_permitted"
  | "job_open"
  | "apply_link"
  | "no_duplicate"
  | "complete"
  | "faithful"
  | "original_wording"
  | "not_misleading";

export type ValidationCheck = {
  id: ValidationCheckId;
  label: string;
  passed: boolean;
  detail: string;
};

export const CHECK_LABELS: Record<ValidationCheckId, string> = {
  source_permitted: "Source permits this collection and use",
  job_open: "Job exists and is open",
  apply_link: "Apply link leads to this job on the official site",
  no_duplicate: "Not already published",
  complete: "No missing content",
  faithful: "Matches the source (nothing invented or dropped)",
  original_wording: "Independent wording (no prohibited copying)",
  not_misleading: "Not misleading, no implied partnership",
};

/** Copy thresholds: share of copied 8-word windows, and longest copied run in words. */
export const MAX_SHINGLE_OVERLAP = 0.2;
export const MAX_COPIED_RUN = 15;

export type LinkCheck = {
  ok: boolean;
  gone: boolean;
  detail: string;
};

export type DuplicateCheck = {
  duplicate: boolean;
  detail: string;
};

function check(id: ValidationCheckId, passed: boolean, detail: string): ValidationCheck {
  return { id, label: CHECK_LABELS[id], passed, detail };
}

export function allowedApplyHosts(source: ExternalSourceRow): string[] {
  const careersHost = hostOf(source.careers_url);
  return [
    ...(careersHost ? [careersHost] : []),
    ...source.allowed_apply_hosts,
    ...source.company_domains,
    ...ATS_APPLY_HOSTS[source.source_type],
  ];
}

export function sourcePermission(source: ExternalSourceRow): { ok: boolean; detail: string } {
  if (source.status !== "active") return { ok: false, detail: `Source is ${source.status}.` };
  if (!source.terms_reviewed_at) {
    return { ok: false, detail: "Terms of use have not been reviewed and recorded for this source." };
  }
  if (source.robots_allowed === false) {
    return { ok: false, detail: "robots.txt disallows the collection endpoint." };
  }
  return {
    ok: true,
    detail: `Basis: ${source.collection_basis}; terms reviewed ${source.terms_reviewed_at.slice(0, 10)}${
      source.terms_reviewed_by ? ` by ${source.terms_reviewed_by}` : ""
    }; robots.txt allows.`,
  };
}

/**
 * Runs every mandatory pre-publication check (spec §4). A job is published
 * automatically only when every returned check passed.
 */
export function validateJob(input: {
  source: ExternalSourceRow;
  raw: RawJob;
  processed: ProcessedJob;
  factCheck: FactCheck | null;
  link: LinkCheck;
  duplicate: DuplicateCheck;
}): ValidationCheck[] {
  const { source, raw, processed, factCheck, link, duplicate } = input;
  const checks: ValidationCheck[] = [];

  const permission = sourcePermission(source);
  checks.push(check("source_permitted", permission.ok, permission.detail));

  checks.push(
    check(
      "job_open",
      !link.gone,
      link.gone ? link.detail : "Listed in the source's current open jobs.",
    ),
  );

  const applyHost = hostOf(raw.applyUrl);
  const hostOk =
    applyHost != null &&
    raw.applyUrl.startsWith("https://") &&
    hostMatchesAny(applyHost, allowedApplyHosts(source));
  checks.push(
    check(
      "apply_link",
      hostOk && link.ok,
      !hostOk
        ? `Apply URL ${raw.applyUrl} is not an https link on the company's or its ATS's domain.`
        : link.detail,
    ),
  );

  checks.push(check("no_duplicate", !duplicate.duplicate, duplicate.detail));

  const missing: string[] = [];
  if (!processed.title.trim()) missing.push("title");
  if (!processed.companyName.trim()) missing.push("company");
  if (processed.summary.trim().length < 60) missing.push("description");
  if (processed.requirements.length === 0) missing.push("requirements");
  if (!processed.location && !processed.workModel) missing.push("location or work model");
  checks.push(
    check(
      "complete",
      missing.length === 0,
      missing.length ? `Missing: ${missing.join(", ")}.` : "All required fields present.",
    ),
  );

  const output = processedText(processed);
  const faithfulIssues: string[] = [];
  if (!factCheck) {
    faithfulIssues.push("AI fact-check did not run, so the content could not be verified.");
  } else {
    faithfulIssues.push(
      ...factCheck.unsupportedClaims.map((c) => `Unsupported: ${c}`),
      ...factCheck.missingKeyRequirements.map((c) => `Dropped requirement: ${c}`),
    );
  }
  const numbers = unsupportedNumbers(raw.text + " " + raw.title, output);
  if (numbers.length) faithfulIssues.push(`Numbers not in source: ${numbers.join(", ")}`);
  faithfulIssues.push(...inventedTermsClaims(raw.text, output));
  checks.push(
    check(
      "faithful",
      faithfulIssues.length === 0,
      faithfulIssues.length ? faithfulIssues.join(" · ") : "Fact-check found no unsupported or dropped content.",
    ),
  );

  const copy = analyzeCopying(raw.text, output);
  const copyOk =
    copy.shingleOverlap <= MAX_SHINGLE_OVERLAP && copy.longestCopiedRun < MAX_COPIED_RUN;
  checks.push(
    check(
      "original_wording",
      copyOk,
      `${Math.round(copy.shingleOverlap * 100)}% copied 8-word windows (max ${Math.round(
        MAX_SHINGLE_OVERLAP * 100,
      )}%), longest copied run ${copy.longestCopiedRun} words (max ${MAX_COPIED_RUN - 1}).`,
    ),
  );

  const misleading = [...(factCheck?.misleading ?? [])];
  if (impliesPartnership(output)) misleading.push("Implies a partnership with mingle.");
  if (source.is_official_partner === false && /\bpartner/i.test(processed.summary)) {
    misleading.push("Summary mentions a partnership that is not recorded.");
  }
  checks.push(
    check(
      "not_misleading",
      misleading.length === 0,
      misleading.length ? misleading.join(" · ") : "No misleading statements found.",
    ),
  );

  return checks;
}

export function failedChecks(checks: ValidationCheck[]): ValidationCheck[] {
  return checks.filter((c) => !c.passed);
}

export function parseChecks(value: unknown): ValidationCheck[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is ValidationCheck =>
      !!item && typeof item === "object" && "id" in item && "passed" in item,
  );
}
