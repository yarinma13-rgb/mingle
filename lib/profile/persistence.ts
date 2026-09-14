import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { isGender, type Gender } from "@/lib/profile/avatar";
import {
  isStartAvailability,
  type StartAvailability,
} from "@/lib/profile/search-status";

export type ProfileState = {
  firstName: string;
  lastName: string;
  headline: string;
  location: string;
  yearsExperience: number | null;
  currentRole: string;
  industry: string;
  profilePhoto: string | null;
  drives: string[];
  workStyle: string[];
  lookingFor: string[];
  beyondCv: string;
  cvPath: string | null;
  cvFileName: string | null;
  gender: Gender | null;
  birthDate: string | null;
  skills: string[];
  salaryExpectation: number | null;
  maxCommuteKm: number;
  githubUrl: string | null;
  githubLogin: string | null;
  githubMeta: Record<string, unknown> | null;
  isEmployed: boolean | null;
  discreetSearch: boolean;
  startAvailability: StartAvailability | null;
  targetRole: string;
};

export const EMPTY_PROFILE: ProfileState = {
  firstName: "",
  lastName: "",
  headline: "",
  location: "",
  yearsExperience: null,
  currentRole: "",
  industry: "",
  profilePhoto: null,
  drives: [],
  workStyle: [],
  lookingFor: [],
  beyondCv: "",
  cvPath: null,
  cvFileName: null,
  gender: null,
  birthDate: null,
  skills: [],
  salaryExpectation: null,
  maxCommuteKm: 0,
  githubUrl: null,
  githubLogin: null,
  githubMeta: null,
  isEmployed: null,
  discreetSearch: false,
  startAvailability: null,
  targetRole: "",
};

const TOTAL_STEPS = 8;

function hasBasicInfo(p: ProfileState) {
  return Boolean(
    p.firstName && p.lastName && p.headline && p.currentRole && p.industry,
  );
}

function hasSearchStatus(p: ProfileState) {
  return p.isEmployed !== null && Boolean(p.startAvailability) && Boolean(p.targetRole.trim());
}

/**
 * Resume pointer. Work style + beyond-the-CV are skippable; once the
 * required basics / drives / skills / search status are filled we land
 * on preview even if those optional steps were skipped.
 */
export function resumeStep(p: ProfileState): number {
  if (!hasBasicInfo(p)) return 1;
  if (!hasSearchStatus(p)) return 2;
  if (p.drives.length === 0) return 3;
  if (p.skills.length === 0) return 5;
  return TOTAL_STEPS;
}

/** Basic info, photo, search status, drives, skills.
 * Work style, salary, and beyond-the-CV are optional. */
export function profileCompletion(p: ProfileState): number {
  const categories = [
    hasBasicInfo(p),
    Boolean(p.profilePhoto),
    hasSearchStatus(p),
    p.drives.length > 0,
    p.skills.length > 0,
  ];
  const done = categories.filter(Boolean).length;
  return Math.round((done / categories.length) * 100);
}

export async function loadProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProfileState> {
  const { data, error } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return EMPTY_PROFILE;

  return {
    firstName: data.first_name ?? "",
    lastName: data.last_name ?? "",
    headline: data.headline ?? "",
    location: data.location ?? "",
    yearsExperience: data.years_experience,
    currentRole: data.current_job_title ?? "",
    industry: data.industry ?? "",
    profilePhoto: data.profile_photo,
    drives: data.drives ?? [],
    workStyle: data.work_style ?? [],
    lookingFor: data.looking_for ?? [],
    beyondCv: data.beyond_cv ?? "",
    cvPath: data.cv_path ?? null,
    cvFileName: data.cv_file_name ?? null,
    gender: isGender(data.gender) ? data.gender : null,
    birthDate: typeof data.birth_date === "string" ? data.birth_date : null,
    skills: Array.isArray(data.skills) ? data.skills : [],
    githubUrl: typeof data.github_url === "string" ? data.github_url : null,
    githubLogin: typeof data.github_login === "string" ? data.github_login : null,
    githubMeta:
      data.github_meta && typeof data.github_meta === "object"
        ? (data.github_meta as Record<string, unknown>)
        : null,
    salaryExpectation:
      typeof data.salary_expectation === "number" ? data.salary_expectation : null,
    maxCommuteKm:
      typeof data.max_commute_km === "number" ? data.max_commute_km : 0,
    isEmployed: typeof data.is_employed === "boolean" ? data.is_employed : null,
    discreetSearch: Boolean(data.discreet_search),
    startAvailability: isStartAvailability(data.start_availability)
      ? data.start_availability
      : null,
    targetRole: typeof data.target_role === "string" ? data.target_role : "",
  };
}

export async function saveProfilePatch(
  supabase: SupabaseClient<Database>,
  userId: string,
  patch: Partial<{
    first_name: string;
    last_name: string;
    headline: string;
    location: string;
    years_experience: number | null;
    current_job_title: string;
    industry: string;
    profile_photo: string | null;
    drives: string[];
    work_style: string[];
    looking_for: string[];
    beyond_cv: string;
    cv_path: string | null;
    cv_file_name: string | null;
    gender: Gender | null;
    birth_date?: string | null;
    skills: string[];
    salary_expectation: number | null;
    max_commute_km: number | null;
    is_employed: boolean | null;
    discreet_search: boolean;
    start_availability: string | null;
    target_role: string | null;
  }>,
) {
  const {
    gender,
    skills,
    salary_expectation,
    max_commute_km,
    is_employed,
    discreet_search,
    start_availability,
    target_role,
    ...rest
  } = patch;
  const { error } = await supabase
    .from("talent_profiles")
    .upsert({ user_id: userId, ...rest }, { onConflict: "user_id" });
  if (error) throw error;

  if ("gender" in patch) {
    const { error: genderError } = await supabase
      .from("talent_profiles")
      .upsert({ user_id: userId, gender: gender ?? null }, { onConflict: "user_id" });
    if (
      genderError &&
      !/gender|schema cache|column/i.test(genderError.message)
    ) {
      throw genderError;
    }
  }

  if (
    "skills" in patch ||
    "salary_expectation" in patch ||
    "max_commute_km" in patch ||
    "is_employed" in patch ||
    "discreet_search" in patch ||
    "start_availability" in patch ||
    "target_role" in patch
  ) {
    const extra: {
      user_id: string;
      skills?: string[];
      salary_expectation?: number | null;
      max_commute_km?: number | null;
      is_employed?: boolean | null;
      discreet_search?: boolean;
      start_availability?: string | null;
      target_role?: string | null;
    } = {
      user_id: userId,
    };
    if ("skills" in patch) extra.skills = skills ?? [];
    if ("salary_expectation" in patch) extra.salary_expectation = salary_expectation ?? null;
    if ("max_commute_km" in patch) extra.max_commute_km = max_commute_km ?? null;
    if ("is_employed" in patch) extra.is_employed = is_employed ?? null;
    if ("discreet_search" in patch) extra.discreet_search = Boolean(discreet_search);
    if ("start_availability" in patch) {
      extra.start_availability = start_availability ?? null;
    }
    if ("target_role" in patch) extra.target_role = target_role?.trim() || null;
    const { error: extraError } = await supabase
      .from("talent_profiles")
      .upsert(extra, { onConflict: "user_id" });
    if (
      extraError &&
      !/skills|salary_expectation|max_commute_km|is_employed|discreet_search|start_availability|target_role|schema cache|column/i.test(
        extraError.message,
      )
    ) {
      throw extraError;
    }
  }
}

export async function saveProfileCompletion(
  supabase: SupabaseClient<Database>,
  userId: string,
  completion: number,
) {
  const { error } = await supabase
    .from("users")
    .update({ profile_completion: completion })
    .eq("id", userId);
  if (error) throw error;
  if (completion >= 100) {
    track(AnalyticsEvent.profileCompleted, { completion }, userId);
  }
}
