import type { AnalyticsEventName } from "@/lib/analytics/events";

/** Product completion % treated as “profile complete” for Aha (matches UI threshold). */
export const PROFILE_COMPLETE_PERCENT = 80;

/** Hours after signup to qualify for Aha v1. */
export const AHA_WINDOW_HOURS = 48;

/** Biweekly report window (days). */
export const GROWTH_REPORT_WINDOW_DAYS = 14;

/** Minimum hours between automated growth nudge emails per user. */
export const GROWTH_NUDGE_MIN_HOURS = 48;

/** North Star event — mutual match that opens a real relationship. */
export const NORTH_STAR_EVENT: AnalyticsEventName = "mingle_created";

export const FUNNEL_STAGES = [
  "signup",
  "onboarding_complete",
  "profile_completed",
  "discover_viewed",
  "connection_sent",
  "mingle_created",
  "message_sent",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

/**
 * Aha v1: profile completed + (connection_sent OR mingle_created) within 48h of signup.
 * Refine when PostHog + Supabase data is richer.
 */
export function userReachedAhaV1(input: {
  profileCompletedAt: string | null;
  firstConnectionOrMingleAt: string | null;
  signedUpAt: string;
}): boolean {
  if (!input.profileCompletedAt || !input.firstConnectionOrMingleAt) return false;
  const signup = new Date(input.signedUpAt).getTime();
  const deadline = signup + AHA_WINDOW_HOURS * 60 * 60 * 1000;
  const profileAt = new Date(input.profileCompletedAt).getTime();
  const actionAt = new Date(input.firstConnectionOrMingleAt).getTime();
  if (profileAt > deadline || actionAt > deadline) return false;
  return profileAt <= actionAt || actionAt <= deadline;
}
