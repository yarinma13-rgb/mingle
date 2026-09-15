import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const ACCOUNT_DELETION_GRACE_DAYS = 14;

export type DeletionStatus = {
  pending: boolean;
  requestedAt: string | null;
  scheduledFor: string | null;
  expired: boolean;
};

export function deletionScheduleFrom(now = new Date()): {
  requestedAt: string;
  scheduledFor: string;
} {
  const requestedAt = now.toISOString();
  const scheduled = new Date(now);
  scheduled.setUTCDate(scheduled.getUTCDate() + ACCOUNT_DELETION_GRACE_DAYS);
  return { requestedAt, scheduledFor: scheduled.toISOString() };
}

export function readDeletionStatus(row: {
  deletion_requested_at?: string | null;
  deletion_scheduled_for?: string | null;
} | null): DeletionStatus {
  const requestedAt = row?.deletion_requested_at ?? null;
  const scheduledFor = row?.deletion_scheduled_for ?? null;
  if (!requestedAt || !scheduledFor) {
    return { pending: false, requestedAt: null, scheduledFor: null, expired: false };
  }
  const expired = new Date(scheduledFor).getTime() <= Date.now();
  return { pending: true, requestedAt, scheduledFor, expired };
}

/** Schedule soft deletion (user can cancel by signing in within 14 days). */
export async function requestAccountDeletion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ scheduledFor: string }> {
  const { requestedAt, scheduledFor } = deletionScheduleFrom();
  const { error } = await supabase
    .from("users")
    .update({
      deletion_requested_at: requestedAt,
      deletion_scheduled_for: scheduledFor,
    } as never)
    .eq("id", userId);
  if (error) {
    const missing =
      /deletion_requested_at|deletion_scheduled_for|schema cache/i.test(
        error.message,
      );
    throw new Error(
      missing
        ? "Account deletion is not available yet — apply migration 0032_account_deletion.sql (and reload PostgREST schema)."
        : error.message,
    );
  }
  return { scheduledFor };
}

/** Cancel a pending deletion — used on successful sign-in during grace. */
export async function cancelAccountDeletion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("deletion_requested_at, deletion_scheduled_for")
    .eq("id", userId)
    .maybeSingle();

  const status = readDeletionStatus(data as {
    deletion_requested_at?: string | null;
    deletion_scheduled_for?: string | null;
  } | null);

  if (!status.pending || status.expired) return false;

  const { error } = await supabase
    .from("users")
    .update({
      deletion_requested_at: null,
      deletion_scheduled_for: null,
    } as never)
    .eq("id", userId);
  if (error) throw error;
  return true;
}
