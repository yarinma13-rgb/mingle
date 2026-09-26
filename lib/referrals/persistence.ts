import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type ReferralStatus = "pending" | "paid";

export type RoleReferralRow = {
  id: string;
  roleId: string;
  referrerUserId: string;
  referredUserId: string | null;
  status: ReferralStatus;
  createdAt: string;
  paidAt: string | null;
};

export function isMissingRoleReferralsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    ((message.includes("role_referrals") ||
      message.includes("claim_role_referral")) &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

function toRow(
  row: Database["public"]["Tables"]["role_referrals"]["Row"],
): RoleReferralRow {
  return {
    id: row.id,
    roleId: row.role_id,
    referrerUserId: row.referrer_user_id,
    referredUserId: row.referred_user_id,
    status: row.status as ReferralStatus,
    createdAt: row.created_at,
    paidAt: row.paid_at,
  };
}

export async function loadReferralsForCompany(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<RoleReferralRow[]> {
  const { data, error } = await supabase
    .from("role_referrals")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingRoleReferralsTable(error)) return [];
    throw error;
  }
  return (data ?? []).map(toRow);
}

export async function getOrCreateReferralLink(
  supabase: SupabaseClient<Database>,
  input: { companyId: string; roleId: string; referrerId: string },
): Promise<{ id: string }> {
  const { data: existing } = await supabase
    .from("role_referrals")
    .select("id")
    .eq("role_id", input.roleId)
    .eq("referrer_user_id", input.referrerId)
    .maybeSingle();
  if (existing) return { id: existing.id };

  const { data, error } = await supabase
    .from("role_referrals")
    .insert({
      company_id: input.companyId,
      role_id: input.roleId,
      referrer_user_id: input.referrerId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id };
}

export async function markReferralStatus(
  supabase: SupabaseClient<Database>,
  referralId: string,
  status: ReferralStatus,
): Promise<void> {
  const { error } = await supabase
    .from("role_referrals")
    .update({
      status,
      paid_at: status === "paid" ? new Date().toISOString() : null,
    })
    .eq("id", referralId);
  if (error) throw error;
}

export async function claimReferral(
  supabase: SupabaseClient<Database>,
  referralId: string,
): Promise<void> {
  const { error } = await supabase.rpc("claim_role_referral", {
    p_referral_id: referralId,
  });
  if (error) throw error;
}
