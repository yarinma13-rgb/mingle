import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";

const ONBOARDING_STEPS = 4;

type UserRoutingRow = {
  user_type: UserType | null;
  onboarding_status: string | null;
  onboarding_step: number | null;
};

/**
 * Soft-cancel a pending 14-day deletion. Never throws — missing migration /
 * PostgREST cache must not block auth or onboarding routing.
 */
async function tryCancelPendingDeletion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("deletion_requested_at, deletion_scheduled_for")
      .eq("id", userId)
      .maybeSingle();

    // Columns missing (migration not applied) or other schema errors → skip.
    if (error || !data) return;

    const { cancelAccountDeletion, readDeletionStatus } = await import(
      "@/lib/account/deletion"
    );
    const status = readDeletionStatus(data);
    if (!status.pending || status.expired) return;

    await cancelAccountDeletion(supabase, userId);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.setItem("mingle.account.restored", "1");
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* never block routing on deletion helpers */
  }
}

/**
 * Resolves where to send the user after auth.
 * Always reconciles user_type first so company accounts cannot be routed
 * to /onboarding/talent because of a stale talent default row.
 */
export async function destinationAfterAuth(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: UserType,
  email?: string | null,
): Promise<string> {
  let reconciled: UserType | null = null;

  if (email) {
    try {
      reconciled = await ensureUserProfile(supabase, userId, email, path);
    } catch {
      // Fall through to a fresh read below.
    }
  }

  // Critical path: only columns that exist before account-deletion migration.
  const { data, error } = await supabase
    .from("users")
    .select("user_type, onboarding_status, onboarding_step")
    .eq("id", userId)
    .maybeSingle();

  const row = (error ? null : data) as UserRoutingRow | null;

  // Prefer the reconciler result. A follow-up read must never regress a
  // just-corrected company account back to the talent default.
  const type: UserType = reconciled ?? row?.user_type ?? path;

  // Best-effort only — must not gate onboarding if deletion columns are absent.
  void tryCancelPendingDeletion(supabase, userId);

  const onboarded =
    row?.onboarding_status === "completed" ||
    (row?.onboarding_step ?? 0) >= ONBOARDING_STEPS;

  if (onboarded) return "/dashboard";
  return `/onboarding/${type}`;
}
