/**
 * Semantic match-score bands (monday-style status colors).
 * Uses mingle tokens: error (brand pink-deep), warning, success.
 *
 * Bands: 0–34 low · 35–69 mid · 70–100 high
 * (Closes the 31–34 gap from the product brief while keeping green at 70+.)
 */

export type ScoreBand = "low" | "mid" | "high";

export function scoreBand(score: number): ScoreBand {
  const n = Math.max(0, Math.min(100, Math.round(score)));
  if (n >= 70) return "high";
  if (n >= 35) return "mid";
  return "low";
}

export function scoreBarClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "bg-mingle-success";
    case "mid":
      return "bg-mingle-warning";
    case "low":
      return "bg-mingle-error";
  }
}

export function scoreTextClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "text-mingle-success";
    case "mid":
      return "text-mingle-warning";
    case "low":
      return "text-mingle-error";
  }
}

export function scoreChipClass(score: number): string {
  switch (scoreBand(score)) {
    case "high":
      return "border-mingle-success/30 bg-mingle-success/15 text-mingle-success";
    case "mid":
      return "border-mingle-warning/40 bg-mingle-warning/20 text-mingle-text";
    case "low":
      return "border-mingle-error/30 bg-mingle-error/12 text-mingle-error";
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
