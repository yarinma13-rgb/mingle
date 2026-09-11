import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

const ONBOARDING_COMPLETE_STEP = 4;

function readMetaUserType(value: unknown): UserType | null {
  return value === "company" || value === "talent" ? value : null;
}

/**
 * Ensures a public.users row exists and keeps user_type correct during
 * early onboarding.
 *
 * Why path correction exists:
 * handle_new_user() defaults missing metadata to "talent". OAuth and some
 * admin/email flows then rely on the app to correct via the auth path
 * (see migration comment in 0001_phase2_auth_onboarding.sql).
 *
 * Rules:
 * 1. No row → insert with meta ?? path
 * 2. Onboarding still open:
 *    - auth metadata always wins when present
 *    - if metadata is missing and the row is still the talent default while
 *      the auth path is company, upgrade to company (one-way fix)
 * 3. Completed onboarding → never change user_type
 */
export async function ensureUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  email: string,
  path: UserType,
): Promise<UserType> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const fromMeta = readMetaUserType(user?.user_metadata?.user_type);
  const intended = fromMeta ?? path;

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
    return intended;
  }

  const completed =
    existing.onboarding_status === "completed" ||
    (existing.onboarding_step ?? 0) >= ONBOARDING_COMPLETE_STEP;

  if (completed) return existing.user_type;

  const shouldCorrect =
    (fromMeta != null && existing.user_type !== fromMeta) ||
    (fromMeta == null &&
      existing.user_type === "talent" &&
      path === "company");

  if (shouldCorrect) {
    const nextType = fromMeta ?? path;
    const { error } = await supabase
      .from("users")
      .update({ user_type: nextType })
      .eq("id", userId);
    if (error) throw error;

    // Keep auth metadata aligned so email-confirm / later sessions do not
    // re-introduce the talent default when the URL path is missing.
    if (fromMeta == null || fromMeta !== nextType) {
      await supabase.auth.updateUser({ data: { user_type: nextType } });
    }

    return nextType;
  }

  return existing.user_type;
}
