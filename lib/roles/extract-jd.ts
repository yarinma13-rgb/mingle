import type { RoleEmploymentType } from "@/lib/supabase/types";
import {
  ROLE_DEPARTMENT_OPTIONS,
  ROLE_SENIORITY_OPTIONS,
  ROLE_SKILL_OPTIONS,
  ROLE_TITLE_SUGGESTIONS,
} from "@/lib/roles/questions";
import { EMPTY_ROLE_DRAFT, type RoleDraft } from "@/lib/roles/persistence";

const TITLE_LINE =
  /(?:job\s*title|role\s*title|position|title|תפקיד)\s*[:\-–]\s*(.+)/i;

function includesPhrase(haystack: string, needle: string): boolean {
  const escaped = needle.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`).test(haystack);
}

function firstMatch<T extends string>(haystack: string, options: readonly T[]): T | "" {
  const found = options.find((option) => includesPhrase(haystack, option));
  return found ?? "";
}

function extractTitle(text: string, haystack: string): string {
  const labeled = text.match(TITLE_LINE);
  if (labeled?.[1]) {
    return labeled[1].trim().replace(/\s+/g, " ").slice(0, 120);
  }
  for (const titles of Object.values(ROLE_TITLE_SUGGESTIONS)) {
    const hit = titles.find((title) => includesPhrase(haystack, title));
    if (hit) return hit;
  }
  const firstLine = text.split(/\n/)[0]?.trim() ?? "";
  if (firstLine.length >= 3 && firstLine.length <= 80 && !firstLine.includes("http")) {
    return firstLine;
  }
  return "";
}

function extractEmployment(haystack: string): RoleEmploymentType {
  if (/(part[-\s]?time|משרה חלקית)/i.test(haystack)) return "part_time";
  if (/(freelance|פרילנס)/i.test(haystack)) return "freelance";
  if (/(contract|קבלן)/i.test(haystack)) return "contract";
  return "full_time";
}

function extractWorkModel(haystack: string): string {
  if (/\bhybrid\b|היברידי/.test(haystack)) return "Hybrid";
  if (/\bremote\b|מהבית|עבודה מרחוק/.test(haystack)) return "Remote";
  if (/\boffice\b|on[-\s]?site|מהמשרד/.test(haystack)) return "Office based";
  return "";
}

export function extractRoleFromJd(
  rawText: string,
  sourceUrl = "",
): RoleDraft {
  const text = rawText.trim().slice(0, 20_000);
  const haystack = text.toLowerCase();
  const skills = ROLE_SKILL_OPTIONS.filter((skill) =>
    includesPhrase(haystack, skill),
  ).slice(0, 5);

  return {
    ...EMPTY_ROLE_DRAFT,
    title: extractTitle(text, haystack),
    department: firstMatch(haystack, ROLE_DEPARTMENT_OPTIONS),
    seniority: firstMatch(haystack, ROLE_SENIORITY_OPTIONS),
    employmentType: extractEmployment(haystack),
    workModel: extractWorkModel(haystack),
    requiredSkills: [...skills],
    description: text.slice(0, 1200),
    sourceJd: text,
    sourceUrl: sourceUrl.trim(),
  };
}

export function roleExtractNeedsBuilder(draft: RoleDraft): boolean {
  return (
    !draft.title.trim() ||
    !draft.department ||
    !draft.seniority ||
    !draft.workModel
  );
}

export function looksLikeUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
