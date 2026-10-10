/**
 * Requirement-tier taxonomy for role skills — separates "must have" from
 * "nice to have" instead of treating every required skill as equally
 * critical. Used both when a role is authored (JD parsing) and when the
 * matching engine scores skill coverage (tiered credit instead of binary).
 */

import { canonicalize } from "@/lib/matching/synonyms";

export const SKILL_TIERS = [
  "MUST_HAVE",
  "PREFERRED",
  "TRANSFERABLE",
  "DEVELOPMENTAL",
  "CONTEXTUAL",
  "UNKNOWN",
] as const;

export type SkillTier = (typeof SKILL_TIERS)[number];

export type SkillRequirement = {
  skill: string;
  tier: SkillTier;
  /** Short human-readable reason, e.g. why something is TRANSFERABLE. */
  rationale?: string;
};

/**
 * How much a required skill counts toward the Role Fit skills factor.
 * MUST_HAVE and an unclassified (UNKNOWN) skill are both treated as fully
 * material — UNKNOWN defaults conservatively rather than being ignored.
 * PREFERRED/TRANSFERABLE matter less; DEVELOPMENTAL/CONTEXTUAL barely move
 * the score (they're explanation context, not gating requirements).
 */
export const SKILL_TIER_WEIGHT: Record<SkillTier, number> = {
  MUST_HAVE: 1,
  PREFERRED: 0.5,
  TRANSFERABLE: 0.5,
  DEVELOPMENTAL: 0.15,
  CONTEXTUAL: 0.15,
  UNKNOWN: 1,
};

export function isSkillTier(value: unknown): value is SkillTier {
  return typeof value === "string" && (SKILL_TIERS as readonly string[]).includes(value);
}

/** Parse a raw jsonb column value (or any untrusted value) into SkillRequirement[]. */
export function parseSkillRequirements(value: unknown): SkillRequirement[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is { skill: unknown; tier: unknown; rationale?: unknown } =>
        typeof item === "object" && item !== null,
    )
    .map((item) => ({
      skill: typeof item.skill === "string" ? item.skill : "",
      tier: isSkillTier(item.tier) ? item.tier : ("UNKNOWN" as const),
      rationale: typeof item.rationale === "string" ? item.rationale : undefined,
    }))
    .filter((item) => item.skill);
}

/** Build a canonical-skill → weight lookup from a role's tiered requirements. */
export function tierWeightsBySkill(
  requirements: SkillRequirement[] | null | undefined,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const req of requirements ?? []) {
    if (!req.skill) continue;
    map.set(canonicalize(req.skill), SKILL_TIER_WEIGHT[req.tier] ?? 1);
  }
  return map;
}

const PREFERRED_CUES = [
  "bonus",
  "nice to have",
  "nice-to-have",
  "advantage",
  "a plus",
  "preferred",
  "יתרון",
  "רצוי",
];

const MUST_CUES = ["required", "must have", "must-have", "נדרש", "חובה"];

/**
 * Heuristic (non-AI) tiering used when Gemini is unavailable: looks at the
 * text immediately around each skill mention for preferred/must-have cues.
 * Deliberately conservative — only ever emits MUST_HAVE/PREFERRED/UNKNOWN,
 * never guesses TRANSFERABLE/DEVELOPMENTAL/CONTEXTUAL without real reasoning.
 */
export function heuristicSkillTiers(
  requiredSkills: string[],
  rawText: string,
): SkillRequirement[] {
  const haystack = rawText.toLowerCase();
  return requiredSkills.map((skill) => {
    const idx = haystack.indexOf(skill.toLowerCase());
    if (idx === -1) {
      return { skill, tier: "UNKNOWN" as const };
    }
    const windowStart = Math.max(0, idx - 60);
    const windowEnd = Math.min(haystack.length, idx + skill.length + 60);
    const window = haystack.slice(windowStart, windowEnd);
    if (PREFERRED_CUES.some((cue) => window.includes(cue))) {
      return { skill, tier: "PREFERRED" as const };
    }
    if (MUST_CUES.some((cue) => window.includes(cue))) {
      return { skill, tier: "MUST_HAVE" as const };
    }
    return { skill, tier: "MUST_HAVE" as const };
  });
}
