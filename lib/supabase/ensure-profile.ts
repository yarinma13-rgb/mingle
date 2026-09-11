import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

const ONBOARDING_COMPLETE_STEP = 4;

function readMetaUserType(value: unknown): UserType | null {
  return value === "company" || value === "talent" ? value : null;
}

/**
 * Makes sure a public.users row exists for the authenticated user.
 *
 * The migration trigger is the first writer, but it can miss or default to
 * talent when metadata is absent. This helper:
 * 1. inserts the row when missing
 * 2. corrects user_type from auth signup metadata when onboarding is still open
 *
 * URL path alone never flips an existing account — only auth metadata does.
 */
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  userType: UserType,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fromMeta = readMetaUserType(user?.user_metadata?.user_type);
  const intended = fromMeta ?? userType;

  const { data: existing, error: readError } = await supabase
    .from("users")
    .select("user_type, onboarding_status, onboarding_step")
    .eq("id", userId)
    .maybeSingle();
  if (readError) throw readError;

  if (!existing) {
    const { error } = await supabase.from("users").insert({
      id: userId,
      email,
      user_type: intended,
    });
    if (error) throw error;
    return;
  }

  const completed =
    existing.onboarding_status === "completed" ||
    (existing.onboarding_step ?? 0) >= ONBOARDING_COMPLETE_STEP;

  if (!completed && fromMeta && existing.user_type !== fromMeta) {
    const { error } = await supabase
      .from("users")
      .update({ user_type: fromMeta })
      .eq("id", userId);
    if (error) throw error;
  }
}
