export const START_AVAILABILITY_OPTIONS = [
  "Immediate",
  "2 weeks",
  "1 month",
  "Notice period",
  "Flexible",
] as const;

export type StartAvailability = (typeof START_AVAILABILITY_OPTIONS)[number];

export function isStartAvailability(value: string | null | undefined): value is StartAvailability {
  return Boolean(
    value &&
      (START_AVAILABILITY_OPTIONS as readonly string[]).includes(value),
  );
}

/** Compact public status line for talent cards / profile. */
export function talentSearchStatusLabel(input: {
  isEmployed: boolean | null;
  discreetSearch: boolean;
}): string | null {
  if (input.isEmployed === null) return null;
  if (input.isEmployed) {
    return input.discreetSearch
      ? "Employed · Discreet search"
      : "Employed · Open search";
  }
  return input.discreetSearch ? "Not employed · Discreet search" : "Not employed";
}
