import {
  salaryAlignment,
  type SalaryAlignment,
} from "@/lib/roles/salary-alignment";

/**
 * Soft score nudge from private salary fit.
 * Does not reshuffle MATCH_WEIGHTS — only ± points when both sides have numbers.
 * Tune SALARY_NUDGE_POINTS if product wants a stronger/weaker effect.
 */
export const SALARY_NUDGE_POINTS = 3;

export function salaryFitNudge(
  expectation: number | null | undefined,
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
): { alignment: SalaryAlignment; nudge: number } {
  const alignment = salaryAlignment(expectation, salaryMin, salaryMax);
  if (alignment === "aligned") return { alignment, nudge: SALARY_NUDGE_POINTS };
  if (alignment === "above_budget")
    return { alignment, nudge: -SALARY_NUDGE_POINTS };
  return { alignment, nudge: 0 };
}

export function applySalaryNudge(
  score: number,
  expectation: number | null | undefined,
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
): { score: number; alignment: SalaryAlignment; nudge: number } {
  const { alignment, nudge } = salaryFitNudge(
    expectation,
    salaryMin,
    salaryMax,
  );
  return {
    alignment,
    nudge,
    score: Math.min(100, Math.max(0, Math.round(score + nudge))),
  };
}
