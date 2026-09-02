import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

/**
 * Makes sure a public.users row exists for the authenticated user.
 *
 * The migration's handle_new_user() trigger is meant to create this row on
 * signup, but triggers on auth.users can be blocked or silently skipped
 * depending on project configuration — this is the app's own safety net so
 * onboarding never depends on that trigger having actually fired.
 * ignoreDuplicates means an existing row (and its onboarding progress) is
 * never overwritten.
 */
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  userType: UserType,
) {
  const { error } = await supabase
    .from("users")
    .upsert(
      { id: userId, email, user_type: userType },
      { onConflict: "id", ignoreDuplicates: true },
    );
  if (error) throw error;
}
