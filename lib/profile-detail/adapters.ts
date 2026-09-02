import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import type { Database } from "@/lib/supabase/types";

type TalentRow = Database["public"]["Tables"]["talent_profiles"]["Row"];
type CompanyRow = Database["public"]["Tables"]["company_profiles"]["Row"];

export function toTalentProfile(row: TalentRow): ProfileState {
  return {
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    headline: row.headline ?? "",
    location: row.location ?? "",
    yearsExperience: row.years_experience,
    currentRole: row.current_job_title ?? "",
    industry: row.industry ?? "",
    profilePhoto: row.profile_photo,
    drives: row.drives ?? [],
    workStyle: row.work_style ?? [],
    lookingFor: row.looking_for ?? [],
    beyondCv: row.beyond_cv ?? "",
    cvPath: row.cv_path ?? null,
    cvFileName: row.cv_file_name ?? null,
  };
}

export function toCompanyProfile(row: CompanyRow): CompanyProfileState {
  return {
    companyName: row.company_name ?? "",
    logo: row.logo,
    mission: row.mission ?? "",
    industry: row.industry ?? "",
    companyStage: row.company_stage ?? "",
    companySize: row.company_size ?? "",
    location: row.location ?? "",
    workEnvironment: row.work_environment ?? [],
    values: row.values ?? [],
    whoThrivesHere: row.who_thrives_here ?? "",
    description: row.description ?? "",
    lookingFor: row.looking_for ?? [],
  };
}
