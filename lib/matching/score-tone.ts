/**
 * Semantic match-score bands for fit strength chips.
 * Brand palette (purple / pink / blue) for scores; green/red stay reserved
 * for explicit fit vs risk copy in Match Report sections.
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

/** Axis / overall bars — brand purple → blue → pink, not traffic-light. */
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
      return "text-mingle-accent-pink";
  }
}

export function scoreChipClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "border-mingle-accent-purple/35 bg-mingle-accent-purple/12 text-mingle-accent-purple";
    case "mid":
      return "border-mingle-accent-blue/35 bg-mingle-accent-blue/12 text-mingle-accent-blue";
    case "low":
      return "border-mingle-accent-pink/35 bg-mingle-accent-pink/12 text-mingle-accent-pink";
  }
}

export function scoreBandLabel(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "Strong fit";
    case "mid":
      return "Worth a look";
    case "low":
      return "Low fit";
  }
}
