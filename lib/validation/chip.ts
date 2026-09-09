export function chipTextError(raw: string): string | null {
  const value = raw.trim();
  if (value.length < 2) return "Use at least two letters";
  if (value.length > 48) return "Keep it shorter";
  if (/\d/.test(value)) return "Letters only, no numbers";
  if (!/[\p{L}]/u.test(value)) return "Use a real word";
  if (/(.)\1{3,}/.test(value)) return "That does not look like a word";
  const letters = value.replace(/[^\p{L}]/gu, "");
  if (letters.length < 2) return "Use a real word";
  return null;
}
