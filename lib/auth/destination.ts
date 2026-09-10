import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, UserType } from "@/lib/supabase/types";

const ONBOARDING_STEPS = 4;

export async function destinationAfterAuth(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: UserType,
): Promise<string> {
  const { data } = await supabase
    .from("users")
    .select("user_type, onboarding_status, onboarding_step")
    .eq("id", userId)
    .maybeSingle();
  const type = data?.user_type ?? path;
  const onboarded =
    data?.onboarding_status === "completed" ||
    (data?.onboarding_step ?? 0) >= ONBOARDING_STEPS;
  if (onboarded) return "/dashboard";
  return `/onboarding/${type}`;
}
