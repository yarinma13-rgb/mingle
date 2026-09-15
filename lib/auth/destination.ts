import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";

const ONBOARDING_STEPS = 4;

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

  const { data } = await supabase
    .from("users")
    .select(
      "user_type, onboarding_status, onboarding_step, deletion_requested_at, deletion_scheduled_for",
    )
    .eq("id", userId)
    .maybeSingle();

  // Prefer the reconciler result. A follow-up read must never regress a
  // just-corrected company account back to the talent default.
  const type: UserType = reconciled ?? data?.user_type ?? path;

  // 14-day grace: signing in again cancels scheduled deletion and restores access.
  if (data?.deletion_requested_at && data?.deletion_scheduled_for) {
    const { cancelAccountDeletion, readDeletionStatus } = await import(
      "@/lib/account/deletion"
    );
    const status = readDeletionStatus(data);
    if (status.pending && !status.expired) {
      await cancelAccountDeletion(supabase, userId);
      if (typeof window !== "undefined") {
        try {
          window.sessionStorage.setItem("mingle.account.restored", "1");
        } catch {
          /* ignore */
        }
      }
    }
  }

  const onboarded =
    data?.onboarding_status === "completed" ||
    (data?.onboarding_step ?? 0) >= ONBOARDING_STEPS;

  if (onboarded) return "/dashboard";
  return `/onboarding/${type}`;
}
