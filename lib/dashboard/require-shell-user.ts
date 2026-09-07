import type { SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  companyInitials,
  isGender,
  personInitials,
  type Gender,
} from "@/lib/profile/avatar";
import type { Database, UserType } from "@/lib/supabase/types";

export type ShellChrome = {
  userName: string;
  initials: string;
  gender: Gender | null;
  photo: string | null;
};

export async function loadShellChrome(
  supabase: SupabaseClient<Database>,
  user: User,
  isCompany: boolean,
): Promise<ShellChrome> {
  const fallbackName = user.email?.split("@")[0] ?? "You";

  if (isCompany) {
    const { data } = await supabase
      .from("company_profiles")
      .select("company_name, logo")
      .eq("user_id", user.id)
      .maybeSingle();
    const name = data?.company_name?.trim() || fallbackName;
    return {
      userName: name,
      initials: companyInitials(name),
      gender: null,
      photo: data?.logo ?? null,
    };
  }

  const { data } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const first = data?.first_name ?? "";
  const last = data?.last_name ?? "";
  const full = `${first} ${last}`.trim();
  return {
    userName: full || fallbackName,
    initials: full ? personInitials(first, last) : "?",
    gender: isGender(data?.gender) ? data.gender : null,
    photo: data?.profile_photo ?? null,
  };
}

export async function requireShellUser(opts?: { userType?: UserType }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  if (opts?.userType && userRow.user_type !== opts.userType) {
    redirect("/dashboard");
  }

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const isCompany = userRow.user_type === "company";
  const chrome = await loadShellChrome(supabase, user, isCompany);

  return {
    supabase,
    user,
    userRow,
    accountLabel,
    initials: chrome.initials,
    isCompany,
    chrome,
    shellAvatar: {
      userName: chrome.userName,
      userInitials: chrome.initials,
      userGender: chrome.gender,
      userPhoto: chrome.photo,
    },
  };
}
