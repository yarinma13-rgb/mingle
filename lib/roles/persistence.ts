import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  RoleEmploymentType,
  RoleStatus,
} from "@/lib/supabase/types";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { ensureRediscoveryForRole } from "@/lib/matching/rediscovery";
import {
  parseSkillRequirements,
  type SkillRequirement,
} from "@/lib/matching/skill-requirement-tiers";

const ROLE_LIST_COLUMNS =
  "id, company_id, title, department, seniority, employment_type, work_model, required_skills, skill_requirements, description, status, salary_min, salary_max, source_jd, source_url, company_presentation, job_presentation, responsibilities, requirements, quiet_signals, created_at, updated_at";

// Same generic "column"/"schema cache" substrings already used below also
// catch a missing skill_requirements column, so it shares the one fallback
// path with company_presentation/job_presentation/responsibilities/requirements
// rather than needing its own — see the shared regex at each call site.

export type RoleRecord = {
  id: string;
  companyId: string;
  title: string;
  department: string | null;
  seniority: string | null;
  employmentType: RoleEmploymentType | null;
  workModel: string | null;
  requiredSkills: string[];
  skillRequirements: SkillRequirement[];
  description: string | null;
  status: RoleStatus;
  salaryMin: number | null;
  salaryMax: number | null;
  sourceJd: string | null;
  sourceUrl: string | null;
  companyPresentation: string | null;
  jobPresentation: string | null;
  responsibilities: string | null;
  requirements: string | null;
  /** Mingo-inferred implicit fit signals — distinct from explicit requiredSkills. */
  quietSignals: string[];
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
  skillRequirements: SkillRequirement[];
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  sourceJd: string;
  sourceUrl: string;
  companyPresentation: string;
  jobPresentation: string;
  responsibilities: string;
  requirements: string;
  quietSignals: string[];
};

export const EMPTY_ROLE_DRAFT: RoleDraft = {
  title: "",
  department: "",
  seniority: "",
  employmentType: "full_time",
  workModel: "",
  requiredSkills: [],
  skillRequirements: [],
  description: "",
  salaryMin: null,
  salaryMax: null,
  sourceJd: "",
  sourceUrl: "",
  companyPresentation: "",
  jobPresentation: "",
  responsibilities: "",
  requirements: "",
  quietSignals: [],
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
  | "skill_requirements"
  | "description"
  | "status"
  | "salary_min"
  | "salary_max"
  | "source_jd"
  | "source_url"
  | "company_presentation"
  | "job_presentation"
  | "responsibilities"
  | "requirements"
  | "quiet_signals"
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
    skillRequirements: parseSkillRequirements(
      (row as { skill_requirements?: unknown }).skill_requirements,
    ),
    description: row.description,
    status: row.status,
    salaryMin: row.salary_min,
    salaryMax: row.salary_max,
    sourceJd: row.source_jd ?? null,
    sourceUrl: row.source_url ?? null,
    companyPresentation: row.company_presentation ?? null,
    jobPresentation: row.job_presentation ?? null,
    responsibilities: row.responsibilities ?? null,
    requirements: row.requirements ?? null,
    quietSignals:
      (row as { quiet_signals?: string[] | null }).quiet_signals ?? [],
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
    skillRequirements: role.skillRequirements,
    description: role.description ?? "",
    salaryMin: role.salaryMin,
    salaryMax: role.salaryMax,
    sourceJd: role.sourceJd ?? "",
    sourceUrl: role.sourceUrl ?? "",
    companyPresentation: role.companyPresentation ?? "",
    jobPresentation: role.jobPresentation ?? "",
    responsibilities: role.responsibilities ?? "",
    requirements: role.requirements ?? "",
    quietSignals: role.quietSignals,
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
  if (error) {
    if (/company_presentation|job_presentation|responsibilities|requirements|skill_requirements|schema cache|column/i.test(error.message)) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("roles")
        .select(
          "id, company_id, title, department, seniority, employment_type, work_model, required_skills, description, status, salary_min, salary_max, source_jd, source_url, created_at, updated_at",
        )
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });
      if (fallbackError) throw fallbackError;
      return (fallback ?? []).map((row) =>
        toRecord({
          ...row,
          skill_requirements: null,
          company_presentation: null,
          job_presentation: null,
          responsibilities: null,
          requirements: null,
          quiet_signals: [],
        } as RoleListRow),
      );
    }
    throw error;
  }
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
      skill_requirements: draft.skillRequirements,
      description: draft.description.trim() || null,
      status: "open",
      salary_min: draft.salaryMin,
      salary_max: draft.salaryMax,
      source_jd: draft.sourceJd.trim() || null,
      source_url: draft.sourceUrl.trim() || null,
      company_presentation: draft.companyPresentation.trim() || null,
      job_presentation: draft.jobPresentation.trim() || null,
      responsibilities: draft.responsibilities.trim() || null,
      requirements: draft.requirements.trim() || null,
      quiet_signals: draft.quietSignals,
    })
    .select(ROLE_LIST_COLUMNS)
    .single();
  if (error) {
    if (/company_presentation|job_presentation|responsibilities|requirements|skill_requirements|schema cache|column/i.test(error.message)) {
      const { data: fallback, error: fallbackError } = await supabase
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
          source_jd: draft.sourceJd.trim() || null,
          source_url: draft.sourceUrl.trim() || null,
        })
        .select(
          "id, company_id, title, department, seniority, employment_type, work_model, required_skills, description, status, salary_min, salary_max, source_jd, source_url, created_at, updated_at",
        )
        .single();
      if (fallbackError) throw fallbackError;
      const record = toRecord({
        ...fallback,
        skill_requirements: null,
        company_presentation: null,
        job_presentation: null,
        responsibilities: null,
        requirements: null,
        quiet_signals: [],
      } as RoleListRow);
      try {
        await ensureRediscoveryForRole(supabase, {
          companyId,
          roleId: record.id,
          roleTitle: record.title,
        });
      } catch (rediscoveryError) {
        console.error("rediscovery after role create", rediscoveryError);
      }
      track(AnalyticsEvent.roleCreated, { role_id: record.id }, companyId);
      return record;
    }
    throw error;
  }
  track(
    AnalyticsEvent.roleCreated,
    { role_id: data.id },
    companyId,
  );
  const record = toRecord(data);
  try {
    await ensureRediscoveryForRole(supabase, {
      companyId,
      roleId: record.id,
      roleTitle: record.title,
    });
  } catch (error) {
    console.error("rediscovery after role create", error);
  }
  return record;
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
      skill_requirements: draft.skillRequirements,
      description: draft.description.trim() || null,
      salary_min: draft.salaryMin,
      salary_max: draft.salaryMax,
      source_jd: draft.sourceJd.trim() || null,
      source_url: draft.sourceUrl.trim() || null,
      company_presentation: draft.companyPresentation.trim() || null,
      job_presentation: draft.jobPresentation.trim() || null,
      responsibilities: draft.responsibilities.trim() || null,
      requirements: draft.requirements.trim() || null,
      quiet_signals: draft.quietSignals,
    })
    .eq("id", roleId)
    .eq("company_id", companyId)
    .select(ROLE_LIST_COLUMNS)
    .single();
  if (error) {
    if (/company_presentation|job_presentation|responsibilities|requirements|skill_requirements|schema cache|column/i.test(error.message)) {
      const { data: fallback, error: fallbackError } = await supabase
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
          source_jd: draft.sourceJd.trim() || null,
          source_url: draft.sourceUrl.trim() || null,
        })
        .eq("id", roleId)
        .eq("company_id", companyId)
        .select(
          "id, company_id, title, department, seniority, employment_type, work_model, required_skills, description, status, salary_min, salary_max, source_jd, source_url, created_at, updated_at",
        )
        .single();
      if (fallbackError) throw fallbackError;
      return toRecord({
        ...fallback,
        skill_requirements: null,
        company_presentation: null,
        job_presentation: null,
        responsibilities: null,
        requirements: null,
        quiet_signals: [],
      } as RoleListRow);
    }
    throw error;
  }
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
  if (error) {
    if (/company_presentation|job_presentation|responsibilities|requirements|skill_requirements|schema cache|column/i.test(error.message)) {
      const { data: fallback, error: fallbackError } = await supabase
        .from("roles")
        .select(
          "id, company_id, title, department, seniority, employment_type, work_model, required_skills, description, status, salary_min, salary_max, source_jd, source_url, created_at, updated_at",
        )
        .eq("id", roleId)
        .eq("company_id", companyId)
        .maybeSingle();
      if (fallbackError) throw fallbackError;
      if (!fallback) return null;
      return toRecord({
        ...fallback,
        skill_requirements: null,
        company_presentation: null,
        job_presentation: null,
        responsibilities: null,
        requirements: null,
        quiet_signals: [],
      } as RoleListRow);
    }
    throw error;
  }
  return data ? toRecord(data) : null;
}
