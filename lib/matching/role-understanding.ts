/**
 * Interpret an open role into requirement buckets for recruiting intelligence.
 * Uses structured role fields when present — never invents requirements.
 */

export type RequirementBucket =
  | "must_have"
  | "preferred"
  | "transferable"
  | "developmental"
  | "contextual"
  | "unknown";

export type RoleRequirement = {
  label: string;
  bucket: RequirementBucket;
  reason: string;
};

export type RoleUnderstanding = {
  requirements: RoleRequirement[];
  unknownNotes: string[];
};

type RoleLike = {
  title?: string | null;
  seniority?: string | null;
  workModel?: string | null;
  requiredSkills?: string[] | null;
  requirements?: string | null;
  responsibilities?: string | null;
  location?: string | null;
};

/**
 * Heuristic role understanding. Skills listed as required → must_have.
 * Soft fields (work model, seniority) → contextual / preferred.
 * Empty structured data → unknown notes (do not invent).
 */
export function understandRole(role: RoleLike): RoleUnderstanding {
  const requirements: RoleRequirement[] = [];
  const unknownNotes: string[] = [];

  const skills = (role.requiredSkills ?? []).map((s) => s.trim()).filter(Boolean);
  if (skills.length === 0) {
    unknownNotes.push(
      "Required skills are not defined yet — mark must-have vs preferred before ranking hard.",
    );
  } else {
    for (const skill of skills) {
      requirements.push({
        label: skill,
        bucket: "must_have",
        reason: "Listed as a required skill on the role.",
      });
    }
  }

  if (role.seniority?.trim()) {
    requirements.push({
      label: `Seniority: ${role.seniority.trim()}`,
      bucket: "preferred",
      reason: "Seniority is stated but adjacent levels may still be transferable.",
    });
  } else {
    unknownNotes.push("Seniority is not set on the role.");
  }

  if (role.workModel?.trim()) {
    requirements.push({
      label: `Work model: ${role.workModel.trim()}`,
      bucket: "contextual",
      reason: "Depends on company environment and candidate preference alignment.",
    });
  } else {
    unknownNotes.push("Work model is not set on the role.");
  }

  if (!role.requirements?.trim() && !role.responsibilities?.trim()) {
    unknownNotes.push(
      "Free-text requirements / responsibilities are thin — JD may not reflect the real hiring need.",
    );
  }

  if (!role.title?.trim()) {
    unknownNotes.push("Role title is missing.");
  }

  return { requirements, unknownNotes };
}
