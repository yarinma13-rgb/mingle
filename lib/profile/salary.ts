/** Monthly ILS ceiling from founder feedback 2026-09-09. */
export const SALARY_MAX_MONTHLY_ILS = 90_000;

export function clampSalary(value: number | null): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;
  return Math.min(SALARY_MAX_MONTHLY_ILS, Math.round(value));
}
