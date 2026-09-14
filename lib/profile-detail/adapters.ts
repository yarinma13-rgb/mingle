import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import type { Database } from "@/lib/supabase/types";
import { isGender } from "@/lib/profile/avatar";
import { isStartAvailability } from "@/lib/profile/search-status";

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
    gender: isGender(row.gender) ? row.gender : null,
    birthDate: typeof row.birth_date === "string" ? row.birth_date : null,
    skills: row.skills ?? [],
    salaryExpectation:
      typeof row.salary_expectation === "number" ? row.salary_expectation : null,
    maxCommuteKm: typeof row.max_commute_km === "number" ? row.max_commute_km : 0,
    githubUrl: typeof row.github_url === "string" ? row.github_url : null,
    githubLogin: typeof row.github_login === "string" ? row.github_login : null,
    githubMeta:
      row.github_meta && typeof row.github_meta === "object"
        ? (row.github_meta as Record<string, unknown>)
        : null,
    isEmployed: typeof row.is_employed === "boolean" ? row.is_employed : null,
    discreetSearch: Boolean(row.discreet_search),
    startAvailability: isStartAvailability(row.start_availability)
      ? row.start_availability
      : null,
    targetRole: typeof row.target_role === "string" ? row.target_role : "",
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
