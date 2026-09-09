import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

export async function destinationAfterAuth(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: UserType,
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("user_type, onboarding_status, profile_completion")
    .eq("id", userId)
    .maybeSingle();
  const type = data?.user_type ?? path;
  if (
    data?.onboarding_status === "completed" &&
    (data.profile_completion ?? 0) >= 100
  ) {
    return "/dashboard";
  }
  if (data?.onboarding_status === "completed") {
    return type === "company" ? "/company-profile/build" : "/profile/build";
  }
  return `/onboarding/${type}`;
}
