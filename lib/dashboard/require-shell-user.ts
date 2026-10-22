import { cache } from "react";
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
import { billingEnabled, loadCompanyBilling } from "@/lib/billing/access";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

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
    .select("first_name, last_name, gender, profile_photo")
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

/**
 * Auth + users row only. Cached per request so the shared (app) layout and
 * leaf pages do not repeat getUser / users lookups.
 */
export const requireAppUser = cache(async function requireAppUser(opts?: {
  userType?: UserType;
  /** Only the billing pages themselves, so they can't redirect to themselves. */
  skipBillingGate?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type, profile_completion, onboarding_status, onboarding_step")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  if (opts?.userType && userRow.user_type !== opts.userType) {
    redirect("/dashboard");
  }

  if (userRow.onboarding_status !== "completed") {
    redirect(`/onboarding/${userRow.user_type}`);
  }

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const isCompany = userRow.user_type === "company";

  // New companies must pick a plan (card on file, 60-day trial) before using
  // the product; a lapsed plan lands on the billing page. Skipped entirely
  // while Stripe isn't configured, and for grandfathered/legacy companies.
  if (isCompany && !opts?.skipBillingGate && billingEnabled()) {
    const workspaceId = await resolveCompanyWorkspaceId(supabase, user.id);
    const billing = await loadCompanyBilling(supabase, workspaceId);
    if (billing.state === "none" || (billing.state === "ok" && billing.status === "incomplete")) {
      redirect("/billing/start");
    }
    if (billing.state === "ok" && !billing.hasAccess) {
      redirect("/billing");
    }
  }

  return {
    supabase,
    user,
    userRow,
    accountLabel,
    isCompany,
  };
});

/**
 * Full shell chrome for the persistent dashboard layout. Deduped with
 * requireAppUser via React cache within the same request.
 */
export const requireShellUser = cache(async function requireShellUser(opts?: {
  userType?: UserType;
}) {
  const base = await requireAppUser(opts);
  const chrome = await loadShellChrome(
    base.supabase,
    base.user,
    base.isCompany,
  );

  return {
    ...base,
    initials: chrome.initials,
    chrome,
    shellAvatar: {
      userName: chrome.userName,
      userInitials: chrome.initials,
      userGender: chrome.gender,
      userPhoto: chrome.photo,
    },
  };
});
