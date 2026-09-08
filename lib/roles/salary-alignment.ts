export type SalaryAlignment = "aligned" | "above_budget" | "unknown";

export function salaryAlignmentLabel(kind: SalaryAlignment): string {
  if (kind === "aligned") return "התאמת שכר: מתאים";
  if (kind === "above_budget") return "מעל התקציב";
  return "לא מספיק מידע";
}

/**
 * Qualitative-only. Never return the raw numbers.
 * Aligned when the candidate's number is in range, or below salary_min.
 * Above budget only when salary_max is set and the candidate is higher.
 */
export function salaryAlignment(
  expectation: number | null | undefined,
  salaryMin: number | null | undefined,
  salaryMax: number | null | undefined,
): SalaryAlignment {
  if (expectation == null || expectation <= 0) return "unknown";
  if (salaryMin == null && salaryMax == null) return "unknown";
  if (salaryMax != null && expectation > salaryMax) return "above_budget";
  return "aligned";
}
