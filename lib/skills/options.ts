import { ROLE_SKILL_OPTIONS } from "@/lib/roles/questions";
import { SKILLS_BY_FIELD, SKILL_FIELDS } from "@/lib/skills/by-field";

export { SKILL_FIELDS };

/** Exact key, or a title/industry that contains a known field name. */
export function matchSkillField(value: string | null | undefined): string | null {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (SKILLS_BY_FIELD[raw]) return raw;
  const lower = raw.toLowerCase();
  const exact = SKILL_FIELDS.find((field) => field.toLowerCase() === lower);
  if (exact) return exact;
  const contained = SKILL_FIELDS.filter(
    (field) =>
      lower.includes(field.toLowerCase()) || field.toLowerCase().includes(lower),
  );
  if (contained.length === 1) return contained[0];
  return contained.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function skillOptionsForField(value: string | null | undefined): string[] {
  const field = matchSkillField(value);
  if (field) return SKILLS_BY_FIELD[field] ?? [...ROLE_SKILL_OPTIONS];
  return [...ROLE_SKILL_OPTIONS];
}
