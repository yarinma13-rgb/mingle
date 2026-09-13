import { overlapCanonical } from "@/lib/matching/synonyms";

export type SkillOverlapSignal = {
  matched: string[];
  requiredCount: number;
  finding: string;
};

/** Soft display helper for role matches. Does not affect match score. */
export function buildSkillOverlapSignal(
  talentSkills: string[],
  requiredSkills: string[],
): SkillOverlapSignal | null {
  const required = requiredSkills.map((item) => item.trim()).filter(Boolean);
  if (required.length === 0) return null;
  const matched = overlapCanonical(talentSkills, required);
  if (matched.length === 0) return null;
  return {
    matched,
    requiredCount: required.length,
    finding: `${matched.slice(0, 4).join(", ")}${
      matched.length > 4 ? ` +${matched.length - 4}` : ""
    } (${matched.length} of ${required.length} required)`,
  };
}
