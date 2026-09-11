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
    .select("user_type, onboarding_status, onboarding_step")
    .eq("id", userId)
    .maybeSingle();

  // Prefer the reconciler result. A follow-up read must never regress a
  // just-corrected company account back to the talent default.
  const type: UserType = reconciled ?? data?.user_type ?? path;

  const onboarded =
    data?.onboarding_status === "completed" ||
    (data?.onboarding_step ?? 0) >= ONBOARDING_STEPS;

  if (onboarded) return "/dashboard";
  return `/onboarding/${type}`;
}
