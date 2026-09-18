/**
 * Semantic match-score bands for fit strength chips.
 * Brand palette for scores; soft warm neutrals for potential gaps
 * (never aggressive rejection red).
 *
 * Bands: 0–34 low · 35–69 mid · 70–100 high
 */

export type ScoreBand = "low" | "mid" | "high";

export function scoreBand(score: number): ScoreBand {
  const n = Math.max(0, Math.min(100, Math.round(score)));
  if (n >= 70) return "high";
  if (n >= 35) return "mid";
  return "low";
}

/** Axis / overall bars — brand connection colors, not traffic-light. */
export function scoreBarClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "bg-mingle-accent-purple";
    case "mid":
      return "bg-mingle-accent-blue";
    case "low":
      return "bg-mingle-accent-pink";
  }
}

export function scoreTextClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "text-mingle-accent-purple";
    case "mid":
      return "text-mingle-accent-blue";
    case "low":
      return "text-mingle-text-secondary";
  }
}

export function scoreChipClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "border-mingle-accent-purple/25 bg-[color:var(--mingle-light-purple)] text-mingle-text";
    case "mid":
      return "border-mingle-accent-blue/25 bg-[color:var(--mingle-light-blue)] text-mingle-text";
    case "low":
      return "border-mingle-border bg-[color:var(--mingle-gap-bg)] text-mingle-text-secondary";
  }
}

export function scoreBandLabel(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "Strong match";
    case "mid":
      return "Worth exploring";
    case "low":
      return "Early signal";
  }
}
