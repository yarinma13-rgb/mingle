import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type TalentReferralStats = {
  code: string;
  shareCount: number;
  openCount: number;
  signupStartedCount: number;
  signedUpCount: number;
  profileCompletedCount: number;
  matchedCount: number;
  friendsJoined: number;
};

export function isMissingTalentReferralsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    ((message.includes("talent_referral") ||
      message.includes("claim_talent_referral") ||
      message.includes("record_talent_referral") ||
      message.includes("bump_talent_referral") ||
      message.includes("mark_talent_referral")) &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

const CODE_ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

function generateCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export async function getOrCreateTalentReferralCode(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data: existing, error: readError } = await supabase
    .from("talent_referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) {
    if (isMissingTalentReferralsTable(readError)) {
      throw readError;
    }
    throw readError;
  }
  if (existing?.code) return existing.code;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateCode(8);
    const { data, error } = await supabase
      .from("talent_referral_codes")
      .insert({ user_id: userId, code })
      .select("code")
      .single();
    if (!error && data?.code) return data.code;
    if (error?.code === "23505") continue;
    if (error) throw error;
  }
  throw new Error("Could not allocate a referral code.");
}

export async function loadTalentReferralStats(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TalentReferralStats | null> {
  try {
    const code = await getOrCreateTalentReferralCode(supabase, userId);
    const { data: codeRow, error: codeError } = await supabase
      .from("talent_referral_codes")
      .select("code, share_count, open_count, signup_started_count")
      .eq("user_id", userId)
      .maybeSingle();
    if (codeError) {
      if (isMissingTalentReferralsTable(codeError)) return null;
      throw codeError;
    }

    const { data: attributions, error: attrError } = await supabase
      .from("talent_referral_attributions")
      .select("status")
      .eq("referrer_user_id", userId);
    if (attrError) {
      if (isMissingTalentReferralsTable(attrError)) return null;
      throw attrError;
    }

    const rows = attributions ?? [];
    const signedUpCount = rows.length;
    const profileCompletedCount = rows.filter(
      (row) =>
        row.status === "profile_completed" || row.status === "matched",
    ).length;
    const matchedCount = rows.filter((row) => row.status === "matched").length;

    return {
      code: codeRow?.code ?? code,
      shareCount: codeRow?.share_count ?? 0,
      openCount: codeRow?.open_count ?? 0,
      signupStartedCount: codeRow?.signup_started_count ?? 0,
      signedUpCount,
      profileCompletedCount,
      matchedCount,
      friendsJoined: signedUpCount,
    };
  } catch (error) {
    if (isMissingTalentReferralsTable(error as { message?: string; code?: string })) {
      return null;
    }
    throw error;
  }
}

export async function claimTalentReferral(
  supabase: SupabaseClient<Database>,
  code: string,
): Promise<void> {
  const { error } = await supabase.rpc("claim_talent_referral", {
    p_code: code.trim().toLowerCase(),
  });
  if (error) throw error;
}

export async function recordTalentReferralOpen(
  supabase: SupabaseClient<Database>,
  code: string,
  visitorKey: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("record_talent_referral_open", {
    p_code: code.trim().toLowerCase(),
    p_visitor_key: visitorKey,
  });
  if (error) throw error;
  return Boolean(data);
}

export async function bumpTalentReferralShare(
  supabase: SupabaseClient<Database>,
  code: string,
): Promise<void> {
  const { error } = await supabase.rpc("bump_talent_referral_share", {
    p_code: code.trim().toLowerCase(),
  });
  if (error) throw error;
}

export async function bumpTalentReferralSignupStarted(
  supabase: SupabaseClient<Database>,
  code: string,
  visitorKey: string,
): Promise<void> {
  const { error } = await supabase.rpc("bump_talent_referral_signup_started", {
    p_code: code.trim().toLowerCase(),
    p_visitor_key: visitorKey,
  });
  if (error) throw error;
}

export async function markTalentReferralProfileCompleted(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const { error } = await supabase.rpc("mark_talent_referral_profile_completed");
  if (error && !isMissingTalentReferralsTable(error)) throw error;
}

export async function markTalentReferralMatched(
  supabase: SupabaseClient<Database>,
): Promise<void> {
  const { error } = await supabase.rpc("mark_talent_referral_matched");
  if (error && !isMissingTalentReferralsTable(error)) throw error;
}
