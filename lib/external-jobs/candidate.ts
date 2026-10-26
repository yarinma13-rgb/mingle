import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { recommendJob, type TalentJobSignals } from "@/lib/external-jobs/recommend";
import type { ExternalJobRow } from "@/lib/external-jobs/types";

type Db = SupabaseClient<Database>;

export type JobsFilters = {
  q: string;
  workModel: string;
  category: string;
  employmentType: string;
  location: string;
  origin: "" | "mingle" | "external";
  sort: "recommended" | "newest";
};

export type JobCard = {
  key: string;
  origin: "mingle" | "external";
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  workModel: string | null;
  employmentType: string | null;
  category: string | null;
  tags: string[];
  href: string;
  date: string;
  score: number;
  reasons: string[];
  saved: boolean;
};

export const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full time",
  part_time: "Part time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
  temporary: "Temporary",
};

function isMissingRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST202" ||
    error.code === "PGRST205" ||
    /does not exist|schema cache|could not find/i.test(error.message ?? "")
  );
}

export async function loadTalentSignals(db: Db, userId: string): Promise<TalentJobSignals> {
  const { data } = await db
    .from("talent_profiles")
    .select("skills, target_role, current_job_title, work_style, location")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    skills: data?.skills ?? [],
    targetRole: data?.target_role ?? null,
    currentTitle: data?.current_job_title ?? null,
    workStyle: data?.work_style ?? [],
    location: data?.location ?? null,
  };
}

export async function loadSavedExternalJobIds(db: Db, userId: string): Promise<Set<string>> {
  const { data, error } = await db
    .from("external_job_saves")
    .select("job_id")
    .eq("user_id", userId);
  if (error) return new Set();
  return new Set((data ?? []).map((row) => row.job_id));
}

function escapeLike(value: string): string {
  return value.replace(/[%_,()]/g, " ").trim();
}

/**
 * Jobs page feed: company-managed open roles and published external jobs,
 * side by side. The two stay separate in the data model; they only meet here.
 */
export async function loadJobsFeed(
  db: Db,
  userId: string,
  filters: JobsFilters,
): Promise<{ cards: JobCard[]; categories: string[] }> {
  const [signals, saved] = await Promise.all([
    loadTalentSignals(db, userId),
    loadSavedExternalJobIds(db, userId),
  ]);
  const q = escapeLike(filters.q).toLowerCase();
  const location = escapeLike(filters.location).toLowerCase();
  const cards: JobCard[] = [];
  const categories = new Set<string>();

  if (filters.origin !== "mingle") {
    let query = db
      .from("external_jobs")
      .select("id, title, company_name, location, work_model, employment_type, category, tags, published_at, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(300);
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,company_name.ilike.%${q}%,category.ilike.%${q}%,summary.ilike.%${q}%`,
      );
    }
    if (location) query = query.ilike("location", `%${location}%`);
    if (filters.workModel) query = query.eq("work_model", filters.workModel);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.employmentType) query = query.eq("employment_type", filters.employmentType);
    const { data, error } = await query;
    if (error && !isMissingRelation(error)) throw error;
    for (const job of data ?? []) {
      if (job.category) categories.add(job.category);
      const rec = recommendJob(signals, {
        title: job.title,
        tags: job.tags,
        location: job.location,
        workModel: job.work_model,
      });
      cards.push({
        key: `x-${job.id}`,
        origin: "external",
        id: job.id,
        title: job.title,
        companyName: job.company_name,
        location: job.location,
        workModel: job.work_model,
        employmentType: job.employment_type,
        category: job.category,
        tags: job.tags,
        href: `/jobs/${job.id}`,
        date: job.updated_at ?? job.published_at ?? "",
        score: rec.score,
        reasons: rec.reasons,
        saved: saved.has(job.id),
      });
    }
  }

  // Company-managed roles have no category; skip them when filtering by one.
  if (filters.origin !== "external" && !filters.category) {
    const { data, error } = await db.rpc("list_open_mingle_roles");
    if (error && !isMissingRelation(error)) throw error;
    for (const role of data ?? []) {
      const company = role.company_name ?? "";
      const haystack = `${role.title} ${company} ${(role.required_skills ?? []).join(" ")}`.toLowerCase();
      if (q && !haystack.includes(q)) continue;
      if (location && !(role.company_location ?? "").toLowerCase().includes(location)) continue;
      if (filters.workModel && role.work_model !== filters.workModel) continue;
      if (filters.employmentType && role.employment_type !== filters.employmentType) continue;
      const rec = recommendJob(signals, {
        title: role.title,
        tags: role.required_skills ?? [],
        location: role.company_location,
        workModel: role.work_model,
      });
      cards.push({
        key: `m-${role.id}`,
        origin: "mingle",
        id: role.id,
        title: role.title,
        companyName: company,
        location: role.company_location,
        workModel: role.work_model,
        employmentType: role.employment_type,
        category: null,
        tags: role.required_skills ?? [],
        href: `/careers/${role.company_slug}`,
        date: role.created_at,
        score: rec.score,
        reasons: rec.reasons,
        saved: false,
      });
    }
  }

  cards.sort((a, b) =>
    filters.sort === "newest"
      ? b.date.localeCompare(a.date)
      : b.score - a.score || b.date.localeCompare(a.date),
  );
  return { cards, categories: [...categories].sort() };
}

export async function loadPublishedExternalJob(
  db: Db,
  id: string,
): Promise<ExternalJobRow | null> {
  const { data, error } = await db
    .from("external_jobs")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();
  if (error) {
    if (isMissingRelation(error)) return null;
    throw error;
  }
  return data;
}

export async function loadSavedExternalJobs(db: Db, userId: string) {
  const ids = [...(await loadSavedExternalJobIds(db, userId))];
  if (!ids.length) return [];
  const { data } = await db
    .from("external_jobs")
    .select("id, title, company_name, location, work_model")
    .in("id", ids)
    .eq("status", "published");
  return data ?? [];
}
