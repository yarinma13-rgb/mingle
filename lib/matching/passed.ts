import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

function isMissingPassedTable(message: string | undefined): boolean {
  return /passed_profiles|schema cache|column/i.test(message ?? "");
}

export async function loadPassedUserIds(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("passed_profiles")
    .select("passed_user_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingPassedTable(error.message)) return [];
    return [];
  }
  return (data ?? []).map((row) => row.passed_user_id);
}

export async function passProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  passedUserId: string,
) {
  const { error } = await supabase
    .from("passed_profiles")
    .insert({ user_id: userId, passed_user_id: passedUserId });
  if (error) {
    if (error.code === "23505") return;
    if (isMissingPassedTable(error.message)) return;
    throw error;
  }
}

export async function unpassProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
  passedUserId: string,
) {
  const { error } = await supabase
    .from("passed_profiles")
    .delete()
    .eq("user_id", userId)
    .eq("passed_user_id", passedUserId);
  if (error && !isMissingPassedTable(error.message)) throw error;
}
