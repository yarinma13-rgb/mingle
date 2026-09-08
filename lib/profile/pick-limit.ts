export const MAX_PROFILE_PICKS = 5;
export const CUSTOM_PICK_MAX_LENGTH = 48;

export function toggleCapped(
  list: string[],
  option: string,
  max = MAX_PROFILE_PICKS,
): string[] {
  if (list.includes(option)) return list.filter((item) => item !== option);
  if (list.length >= max) return list;
  return [...list, option];
}

export function addCustomCapped(
  list: string[],
  raw: string,
  max = MAX_PROFILE_PICKS,
  known: readonly string[] = [],
): string[] {
  const next = raw.trim().replace(/\s+/g, " ").slice(0, CUSTOM_PICK_MAX_LENGTH);
  if (!next) return list;
  const canonical =
    known.find((item) => item.toLowerCase() === next.toLowerCase()) ?? next;
  if (list.some((item) => item.toLowerCase() === canonical.toLowerCase())) {
    return list;
  }
  if (list.length >= max) return list;
  return [...list, canonical];
}

export function extraChipValues(
  selected: string[],
  options: readonly string[],
): string[] {
  const known = new Set(options);
  return selected.filter((item) => !known.has(item));
}
