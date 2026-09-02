import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

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
};

const TOTAL_STEPS = 6;

function hasBasicInfo(p: ProfileState) {
  return Boolean(
    p.firstName &&
      p.lastName &&
      p.headline &&
      p.location &&
      p.yearsExperience !== null &&
      p.currentRole &&
      p.industry,
  );
}

function hasBeyondCv(p: ProfileState) {
  return p.beyondCv.trim().length >= 20;
}

/** No separate "step" column — the furthest-incomplete step is derived
 * directly from which fields are already filled, so resuming after a
 * refresh never needs its own persisted pointer. */
export function resumeStep(p: ProfileState): number {
  if (!hasBasicInfo(p)) return 1;
  if (p.drives.length === 0) return 2;
  if (p.workStyle.length === 0) return 3;
  if (p.lookingFor.length === 0) return 4;
  if (!hasBeyondCv(p)) return 5;
  return TOTAL_STEPS;
}

/** Six equally-weighted categories per PRODUCT_SPEC.md's profile
 * completion rule: basic info, photo, drives, work style, looking for,
 * beyond the CV. */
export function profileCompletion(p: ProfileState): number {
  const categories = [
    hasBasicInfo(p),
    Boolean(p.profilePhoto),
    p.drives.length > 0,
    p.workStyle.length > 0,
    p.lookingFor.length > 0,
    hasBeyondCv(p),
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
    years_experience: number;
    current_job_title: string;
    industry: string;
    profile_photo: string | null;
    drives: string[];
    work_style: string[];
    looking_for: string[];
    beyond_cv: string;
    cv_path: string | null;
    cv_file_name: string | null;
  }>,
) {
  const { error } = await supabase
    .from("talent_profiles")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
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
