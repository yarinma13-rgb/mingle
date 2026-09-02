import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import type { TalentMatchInput, CompanyMatchInput } from "@/lib/matching/engine";

export async function loadTalentMatchInput(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TalentMatchInput | null> {
  const [{ data: profileRow }, { data: prefRow }] = await Promise.all([
    supabase.from("talent_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("talent_preferences")
      .select("*")
      .eq("talent_id", userId)
      .maybeSingle(),
  ]);
  if (!profileRow) return null;

  return {
    profile: toTalentProfile(profileRow),
    careerGoal: prefRow?.career_goals ?? "",
    companyTypes: prefRow?.company_types ?? [],
  };
}

export async function loadCompanyMatchInput(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CompanyMatchInput | null> {
  const [{ data: profileRow }, { data: prefRow }] = await Promise.all([
    supabase.from("company_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("company_preferences")
      .select("*")
      .eq("company_id", userId)
      .maybeSingle(),
  ]);
  if (!profileRow) return null;

  return {
    profile: toCompanyProfile(profileRow),
    connectingAbout: prefRow?.hiring_needs ?? "",
    culturePriorities: prefRow?.culture_priorities ?? [],
  };
}
