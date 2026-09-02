import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CompanyProfileState = {
  companyName: string;
  logo: string | null;
  mission: string;
  industry: string;
  companyStage: string;
  companySize: string;
  location: string;
  workEnvironment: string[];
  values: string[];
  whoThrivesHere: string;
  description: string;
  lookingFor: string[];
};

export const EMPTY_COMPANY_PROFILE: CompanyProfileState = {
  companyName: "",
  logo: null,
  mission: "",
  industry: "",
  companyStage: "",
  companySize: "",
  location: "",
  workEnvironment: [],
  values: [],
  whoThrivesHere: "",
  description: "",
  lookingFor: [],
};

const TOTAL_STEPS = 6;

function hasBasicInfo(p: CompanyProfileState) {
  return Boolean(
    p.companyName &&
      p.mission &&
      p.industry &&
      p.companyStage &&
      p.companySize &&
      p.location,
  );
}

function hasReflection(p: CompanyProfileState) {
  return (
    p.whoThrivesHere.trim().length >= 20 && p.description.trim().length >= 20
  );
}

/** Same approach as talent profiles: the furthest-incomplete step is
 * derived from which fields are filled, so there's no separate step
 * pointer to keep in sync. */
export function resumeCompanyStep(p: CompanyProfileState): number {
  if (!hasBasicInfo(p)) return 1;
  if (p.workEnvironment.length === 0) return 2;
  if (p.values.length === 0) return 3;
  if (p.lookingFor.length === 0) return 4;
  if (!hasReflection(p)) return 5;
  return TOTAL_STEPS;
}

/** Six equally-weighted categories, mirroring the talent side: basic
 * info, logo, how we work, what we value, what we're looking for, and
 * the who-thrives-here / what-we're-building reflection. */
export function companyProfileCompletion(p: CompanyProfileState): number {
  const categories = [
    hasBasicInfo(p),
    Boolean(p.logo),
    p.workEnvironment.length > 0,
    p.values.length > 0,
    p.lookingFor.length > 0,
    hasReflection(p),
  ];
  const done = categories.filter(Boolean).length;
  return Math.round((done / categories.length) * 100);
}

export async function loadCompanyProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CompanyProfileState> {
  const { data, error } = await supabase
    .from("company_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_COMPANY_PROFILE;

  return {
    companyName: data.company_name ?? "",
    logo: data.logo,
    mission: data.mission ?? "",
    industry: data.industry ?? "",
    companyStage: data.company_stage ?? "",
    companySize: data.company_size ?? "",
    location: data.location ?? "",
    workEnvironment: data.work_environment ?? [],
    values: data.values ?? [],
    whoThrivesHere: data.who_thrives_here ?? "",
    description: data.description ?? "",
    lookingFor: data.looking_for ?? [],
  };
}

export async function saveCompanyProfilePatch(
  supabase: SupabaseClient<Database>,
  userId: string,
  patch: Partial<{
    company_name: string;
    logo: string | null;
    mission: string;
    industry: string;
    company_stage: string;
    company_size: string;
    location: string;
    work_environment: string[];
    values: string[];
    who_thrives_here: string;
    description: string;
    looking_for: string[];
  }>,
) {
  const { error } = await supabase
    .from("company_profiles")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}
