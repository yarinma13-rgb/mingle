export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]["value"];

export function isGender(value: unknown): value is Gender {
  return (
    value === "male" ||
    value === "female" ||
    value === "prefer_not_to_say"
  );
}

export function personInitials(
  firstName: string,
  lastName: string,
): string {
  const first = Array.from(firstName.trim())[0] ?? "";
  const last = Array.from(lastName.trim())[0] ?? "";
  const pair = `${first}${last}`.toUpperCase();
  return pair || "?";
}

export function companyInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = Array.from(parts[0])[0] ?? "";
    const b = Array.from(parts[1])[0] ?? "";
    return `${a}${b}`.toUpperCase() || "?";
  }
  const chars = Array.from(parts[0] ?? "");
  return (chars.slice(0, 2).join("") || "?").toUpperCase();
}

export function avatarToneClass(gender: Gender | null | undefined): string {
  if (gender === "male") return "bg-mingle-accent-blue";
  if (gender === "female") return "bg-mingle-accent-pink";
  return "bg-mingle-accent-purple";
}
