import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  RoleEmploymentType,
  RoleStatus,
} from "@/lib/supabase/types";

const ROLE_LIST_COLUMNS =
  "id, company_id, title, department, seniority, employment_type, work_model, required_skills, description, status, salary_min, salary_max, created_at, updated_at";

export type RoleRecord = {
  id: string;
  companyId: string;
  title: string;
  department: string | null;
  seniority: string | null;
  employmentType: RoleEmploymentType | null;
  workModel: string | null;
  requiredSkills: string[];
  description: string | null;
  status: RoleStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RoleDraft = {
  title: string;
  department: string;
  seniority: string;
  employmentType: RoleEmploymentType;
  workModel: string;
  requiredSkills: string[];
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
};

export const EMPTY_ROLE_DRAFT: RoleDraft = {
  title: "",
  department: "",
  seniority: "",
  employmentType: "full_time",
  workModel: "",
  requiredSkills: [],
  description: "",
  salaryMin: null,
  salaryMax: null,
};

type RoleListRow = Pick<
  Database["public"]["Tables"]["roles"]["Row"],
  | "id"
  | "company_id"
  | "title"
  | "department"
  | "seniority"
  | "employment_type"
  | "work_model"
  | "required_skills"
  | "description"
  | "status"
  | "salary_min"
  | "salary_max"
  | "created_at"
  | "updated_at"
>;

function toRecord(row: RoleListRow): RoleRecord {
  return {
    id: row.id,
    companyId: row.company_id,
    title: row.title,
    department: row.department,
    seniority: row.seniority,
    employmentType: row.employment_type,
    workModel: row.work_model,
    requiredSkills: row.required_skills ?? [],
    description: row.description,
    status: row.status,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isMissingRolesTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("roles") &&
      (message.includes("does not exist") || message.includes("schema cache") || message.includes("could not find")))
  );
}

export function draftFromRole(role: RoleRecord): RoleDraft {
  return {
    title: role.title,
    department: role.department ?? "",
    seniority: role.seniority ?? "",
    employmentType: role.employmentType ?? "full_time",
    workModel: role.workModel ?? "",
    requiredSkills: role.requiredSkills,
    description: role.description ?? "",
    salaryMin: role.salaryMin,
    salaryMax: role.salaryMax,
  };
}

export async function loadCompanyRoles(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<RoleRecord[]> {
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_LIST_COLUMNS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toRecord);
}

export async function createCompanyRole(
  supabase: SupabaseClient<Database>,
  companyId: string,
  draft: RoleDraft,
): Promise<RoleRecord> {
  const { data, error } = await supabase
    .from("roles")
    .insert({
      company_id: companyId,
      title: draft.title.trim(),
      department: draft.department || null,
      seniority: draft.seniority || null,
      employment_type: draft.employmentType,
      work_model: draft.workModel || null,
      required_skills: draft.requiredSkills,
      description: draft.description.trim() || null,
      status: "open",
      salary_min: draft.salaryMin,
      salary_max: draft.salaryMax,
    })
    .select(ROLE_LIST_COLUMNS)
    .single();
  if (error) throw error;
  return toRecord(data);
}

export async function updateCompanyRole(
  supabase: SupabaseClient<Database>,
  roleId: string,
  companyId: string,
  draft: RoleDraft,
): Promise<RoleRecord> {
  const { data, error } = await supabase
    .from("roles")
    .update({
      title: draft.title.trim(),
      department: draft.department || null,
      seniority: draft.seniority || null,
      employment_type: draft.employmentType,
      work_model: draft.workModel || null,
      required_skills: draft.requiredSkills,
      description: draft.description.trim() || null,
      salary_min: draft.salaryMin,
      salary_max: draft.salaryMax,
    })
    .eq("id", roleId)
    .eq("company_id", companyId)
    .select(ROLE_LIST_COLUMNS)
    .single();
  if (error) throw error;
  return toRecord(data);
}

export async function updateCompanyRoleStatus(
  supabase: SupabaseClient<Database>,
  roleId: string,
  companyId: string,
  status: RoleStatus,
): Promise<RoleRecord> {
  const { data, error } = await supabase
    .from("roles")
    .update({ status })
    .eq("id", roleId)
    .eq("company_id", companyId)
    .select(ROLE_LIST_COLUMNS)
    .single();
  if (error) throw error;
  return toRecord(data);
}

export async function loadCompanyRole(
  supabase: SupabaseClient<Database>,
  roleId: string,
  companyId: string,
): Promise<RoleRecord | null> {
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_LIST_COLUMNS)
    .eq("id", roleId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (error) throw error;
  return data ? toRecord(data) : null;
}
