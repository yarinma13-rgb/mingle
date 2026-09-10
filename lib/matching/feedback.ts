import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const NOT_FIT_REASONS = [
  "Skills",
  "Experience",
  "Salary",
  "Location",
  "Seniority",
  "Culture",
  "Other",
] as const;

export type NotFitReason = (typeof NOT_FIT_REASONS)[number];
export type MatchFeedbackAction = "interested" | "not_fit";

function isMissingFeedbackTable(message: string | undefined): boolean {
  return /match_feedback|schema cache|column/i.test(message ?? "");
}

export async function loadMatchFeedbackMap(
  supabase: SupabaseClient<Database>,
  actorId: string,
): Promise<Record<string, MatchFeedbackAction>> {
  const { data, error } = await supabase
    .from("match_feedback")
    .select("target_user_id, action")
    .eq("actor_id", actorId);
  if (error || !data) return {};
  const map: Record<string, MatchFeedbackAction> = {};
  for (const row of data) {
    if (row.action === "interested" || row.action === "not_fit") {
      map[row.target_user_id] = row.action;
    }
  }
  return map;
}

export async function loadMatchFeedbackAction(
  supabase: SupabaseClient<Database>,
  actorId: string,
  targetUserId: string,
): Promise<MatchFeedbackAction | null> {
  const { data, error } = await supabase
    .from("match_feedback")
    .select("action")
    .eq("actor_id", actorId)
    .eq("target_user_id", targetUserId)
    .maybeSingle();
  if (error) {
    if (isMissingFeedbackTable(error.message)) return null;
    return null;
  }
  if (data?.action === "interested" || data?.action === "not_fit") {
    return data.action;
  }
  return null;
}

export async function recordMatchFeedback(
  supabase: SupabaseClient<Database>,
  actorId: string,
  targetUserId: string,
  action: MatchFeedbackAction,
  reason?: NotFitReason | null,
) {
  const { error } = await supabase.from("match_feedback").upsert(
    {
      actor_id: actorId,
      target_user_id: targetUserId,
      action,
      reason: reason ?? null,
      free_text: null,
    },
    { onConflict: "actor_id,target_user_id" },
  );
  if (error) {
    if (isMissingFeedbackTable(error.message)) return;
    throw error;
  }
}
