import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function loadSavedUserIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("saved_profiles")
    .select("saved_user_id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((row) => row.saved_user_id);
}

export async function saveProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  savedUserId: string,
) {
  const { error } = await supabase
    .from("saved_profiles")
    .insert({ user_id: userId, saved_user_id: savedUserId });
  if (error) {
    // Unique (user_id, saved_user_id) — saving twice is already saved.
    if (error.code === "23505") return;
    throw error;
  }
}

export async function unsaveProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  savedUserId: string,
) {
  const { error } = await supabase
    .from("saved_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("saved_user_id", savedUserId);
  if (error) throw error;
}
