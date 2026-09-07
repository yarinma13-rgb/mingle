export const MAX_PROFILE_PICKS = 5;

export function toggleCapped(
  list: string[],
  option: string,
  max = MAX_PROFILE_PICKS,
): string[] {
  if (list.includes(option)) return list.filter((item) => item !== option);
  if (list.length >= max) return list;
  return [...list, option];
}
