/**
 * The database raises `plan_limit_jobs` / `plan_limit_team` (migration 0052)
 * when a write would exceed the company's plan. Turn that into something a
 * person can act on.
 */
export type PlanLimitKind = "jobs" | "team";

export function planLimitKind(error: unknown): PlanLimitKind | null {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  if (message.includes("plan_limit_jobs")) return "jobs";
  if (message.includes("plan_limit_team")) return "team";
  return null;
}

export function planLimitMessage(kind: PlanLimitKind): string {
  return kind === "jobs"
    ? "You've reached the active-jobs limit on your plan. Upgrade your plan to open more roles."
    : "You've reached the team-size limit on your plan. Upgrade your plan to invite more teammates.";
}

/** Friendly message if `error` is a plan-limit error, otherwise null. */
export function planLimitMessageFor(error: unknown): string | null {
  const kind = planLimitKind(error);
  return kind ? planLimitMessage(kind) : null;
}
