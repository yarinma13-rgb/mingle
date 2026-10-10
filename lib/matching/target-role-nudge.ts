import { canonicalize } from "@/lib/matching/synonyms";

/** Soft score boost when talent's target role aligns with a job/company signal. */
export const TARGET_ROLE_NUDGE_POINTS = 6;

function tokens(value: string): string[] {
  return canonicalize(value)
    .split(/[^a-z0-9א-ת]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

/**
 * Returns true when the free-text target role meaningfully overlaps a
 * role title / department / looking-for chip — without requiring exact match.
 */
export function targetRoleOverlaps(
  targetRole: string | null | undefined,
  signals: Array<string | null | undefined>,
): boolean {
  const target = (targetRole ?? "").trim();
  if (!target) return false;
  const targetTokens = new Set(tokens(target));
  if (targetTokens.size === 0) return false;

  for (const signal of signals) {
    const raw = (signal ?? "").trim();
    if (!raw) continue;
    const hay = canonicalize(raw);
    const needle = canonicalize(target);
    if (hay.includes(needle) || needle.includes(hay)) return true;
    const signalTokens = tokens(raw);
    const shared = signalTokens.filter((token) => targetTokens.has(token));
    if (shared.length >= 1 && shared.length / Math.max(targetTokens.size, 1) >= 0.5) {
      return true;
    }
  }
  return false;
}

export function applyTargetRoleNudge(
  score: number,
  targetRole: string | null | undefined,
  signals: Array<string | null | undefined>,
): { score: number; nudge: number; matched: boolean } {
  const matched = targetRoleOverlaps(targetRole, signals);
  const nudge = matched ? TARGET_ROLE_NUDGE_POINTS : 0;
  return {
    matched,
    nudge,
    score: Math.min(100, Math.max(0, Math.round(score + nudge))),
  };
}
