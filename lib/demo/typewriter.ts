/** Character-by-character reveal for monday-style in-screen typing. */
export function typeProgress(
  fullText: string,
  startAtMs: number,
  elapsedMs: number,
  charsPerSecond = 32,
): string {
  if (!fullText) return "";
  if (elapsedMs < startAtMs) return "";
  const chars = Math.floor(
    ((elapsedMs - startAtMs) / 1000) * charsPerSecond,
  );
  return fullText.slice(0, Math.min(fullText.length, Math.max(0, chars)));
}

export function isTypingComplete(
  fullText: string,
  startAtMs: number,
  elapsedMs: number,
  charsPerSecond = 32,
): boolean {
  if (!fullText) return true;
  const needed = startAtMs + (fullText.length / charsPerSecond) * 1000;
  return elapsedMs >= needed;
}

export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Ease a numeric value from 0→target over a window (score count-up etc.). */
export function countUp(
  target: number,
  startAtMs: number,
  durationMs: number,
  elapsedMs: number,
): number {
  if (elapsedMs < startAtMs) return 0;
  const t = clamp01((elapsedMs - startAtMs) / Math.max(1, durationMs));
  const eased = 1 - (1 - t) ** 3;
  return Math.round(target * eased);
}
