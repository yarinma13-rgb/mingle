import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CareerPageRole = {
  id: string;
  title: string;
  department: string | null;
  employmentType: string | null;
  workModel: string | null;
  requiredSkills: string[];
};

export type CareerPageData = {
  companyName: string;
  logo: string | null;
  mission: string | null;
  industry: string | null;
  location: string | null;
  description: string | null;
  roles: CareerPageRole[];
};

export function isMissingCareerPageFunction(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    (message.includes("career_page_by_slug") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function loadCareerPage(
  supabase: SupabaseClient<Database>,
  slug: string,
): Promise<CareerPageData | null> {
  const { data, error } = await supabase.rpc("career_page_by_slug", {
    p_slug: slug,
  });
  if (error) {
    if (isMissingCareerPageFunction(error)) return null;
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  const roles: CareerPageRole[] = (row.roles ?? []).map((role) => ({
    id: role.id,
    title: role.title,
    department: role.department ?? null,
    employmentType: role.employmentType ?? null,
    workModel: role.workModel ?? null,
    requiredSkills: role.requiredSkills ?? [],
  }));

  return {
    companyName: row.company_name ?? "",
    logo: row.logo ?? null,
    mission: row.mission ?? null,
    industry: row.industry ?? null,
    location: row.location ?? null,
    description: row.description ?? null,
    roles,
  };
}

export function isMissingRoleApplicationsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    (message.includes("role_applications") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function hasAppliedToRole(
  supabase: SupabaseClient<Database>,
  roleId: string,
  candidateId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("role_applications")
    .select("id")
    .eq("role_id", roleId)
    .eq("candidate_id", candidateId)
    .maybeSingle();
  if (error) {
    if (isMissingRoleApplicationsTable(error)) return false;
    throw error;
  }
  return Boolean(data);
}

export async function applyToRole(
  supabase: SupabaseClient<Database>,
  roleId: string,
  candidateId: string,
): Promise<void> {
  const { error } = await supabase.from("role_applications").upsert(
    { role_id: roleId, candidate_id: candidateId },
    { onConflict: "role_id,candidate_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}
