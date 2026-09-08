import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CompanyMemberRole } from "@/lib/supabase/types";

export const TEAM_ROLE_OPTIONS: { value: CompanyMemberRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "hr", label: "HR" },
  { value: "team_lead", label: "Team lead" },
  { value: "owner", label: "Owner" },
];

export function teamRoleLabel(role: string): string {
  return TEAM_ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role;
}

export function isMissingTeamTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    ((message.includes("company_members") ||
      message.includes("pending_company_invite") ||
      message.includes("claim_company_invite")) &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export type TeamMemberRow = {
  id: string;
  email: string;
  role: CompanyMemberRole;
  status: "invited" | "active";
  userId: string | null;
};

export type PendingInvite = {
  id: string;
  companyId: string;
  companyName: string;
  role: string;
};

export async function loadTeamMembers(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<TeamMemberRow[]> {
  const { data, error } = await supabase
    .from("company_members")
    .select("id, email, role, status, user_id")
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    userId: row.user_id,
  }));
}

export async function inviteTeammate(
  supabase: SupabaseClient<Database>,
  companyId: string,
  invitedBy: string,
  input: { email: string; role: CompanyMemberRole },
) {
  const email = input.email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("company_members")
    .insert({
      company_id: companyId,
      email,
      role: input.role,
      invited_by: invitedBy,
      status: "invited",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data;
}

export async function loadPendingCompanyInvite(
  supabase: SupabaseClient<Database>,
): Promise<PendingInvite | null> {
  const { data, error } = await supabase.rpc("pending_company_invite");
  if (error) {
    if (isMissingTeamTable(error)) return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) return null;
  return {
    id: row.id,
    companyId: row.company_id,
    companyName: row.company_name,
    role: row.role,
  };
}

export async function claimCompanyInvite(
  supabase: SupabaseClient<Database>,
): Promise<{ companyId: string; companyName: string } | null> {
  const { data, error } = await supabase.rpc("claim_company_invite");
  if (error) {
    if (isMissingTeamTable(error)) return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.company_id) return null;
  return { companyId: row.company_id, companyName: row.company_name };
}

export async function resolveCompanyWorkspaceId(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return membership?.company_id ?? userId;
}
