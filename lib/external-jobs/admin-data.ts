import { createAdminClient } from "@/lib/supabase/admin";
import { loadSettings, type AdminDb, type EngineSettings } from "@/lib/external-jobs/store";
import type { ExternalJobStatus } from "@/lib/supabase/types";
import type { ExternalJobRow, ExternalSourceRow } from "@/lib/external-jobs/types";

export const JOB_TABS: Record<string, { label: string; statuses: ExternalJobStatus[] }> = {
  discovered: { label: "Discovered", statuses: ["discovered"] },
  published: { label: "Published", statuses: ["published"] },
  pending: { label: "Pending Review", statuses: ["pending_review", "paused"] },
  rejected: { label: "Rejected", statuses: ["rejected"] },
  expired: { label: "Expired", statuses: ["expired", "removed"] },
};

export function adminDbOrNull(): AdminDb | null {
  return createAdminClient();
}

const ALL_STATUSES: ExternalJobStatus[] = [
  "discovered",
  "pending_review",
  "published",
  "rejected",
  "paused",
  "expired",
  "removed",
];

export type Overview = {
  settings: EngineSettings;
  counts: Record<ExternalJobStatus, number>;
  sources: { active: number; paused: number; failing: number; publishingPaused: number };
  views30d: number;
  clicks30d: number;
  saves30d: number;
  publishedPerDay: Array<{ day: string; count: number }>;
  topJobs: Array<{ id: string; title: string; company: string; views: number; clicks: number }>;
  runs: Array<{ id: string; trigger: string; started_at: string; finished_at: string | null; stats: Record<string, number>; errorCount: number }>;
  openTakedowns: number;
};

async function countStatus(db: AdminDb, status: ExternalJobStatus): Promise<number> {
  const { count } = await db
    .from("external_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", status);
  return count ?? 0;
}

export async function loadOverview(db: AdminDb): Promise<Overview> {
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const since14 = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const [settings, countsList, sourcesRes, engagementRes, publishedRes, runsRes, takedownRes] =
    await Promise.all([
      loadSettings(db),
      Promise.all(ALL_STATUSES.map((s) => countStatus(db, s))),
      db.from("external_job_sources").select("status, consecutive_failures, publishing_paused"),
      db.from("external_job_engagement").select("job_id, kind").gte("created_at", since30).limit(20_000),
      db.from("external_jobs").select("published_at").gte("published_at", since14).limit(5000),
      db
        .from("external_crawl_runs")
        .select("id, trigger, started_at, finished_at, stats, errors")
        .order("started_at", { ascending: false })
        .limit(10),
      db
        .from("external_job_takedowns")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending_verification", "needs_review"]),
    ]);

  const counts = Object.fromEntries(ALL_STATUSES.map((s, i) => [s, countsList[i]])) as Record<
    ExternalJobStatus,
    number
  >;

  const sources = { active: 0, paused: 0, failing: 0, publishingPaused: 0 };
  for (const s of sourcesRes.data ?? []) {
    if (s.status === "active") sources.active += 1;
    if (s.status === "paused") sources.paused += 1;
    if (s.status !== "removed" && s.consecutive_failures > 0) sources.failing += 1;
    if (s.status !== "removed" && s.publishing_paused) sources.publishingPaused += 1;
  }

  let views30d = 0;
  let clicks30d = 0;
  let saves30d = 0;
  const perJob = new Map<string, { views: number; clicks: number }>();
  for (const e of engagementRes.data ?? []) {
    const entry = perJob.get(e.job_id) ?? { views: 0, clicks: 0 };
    if (e.kind === "view") {
      views30d += 1;
      entry.views += 1;
    } else if (e.kind === "apply_click") {
      clicks30d += 1;
      entry.clicks += 1;
    } else {
      saves30d += 1;
    }
    perJob.set(e.job_id, entry);
  }
  const topIds = [...perJob.entries()]
    .sort((a, b) => b[1].clicks - a[1].clicks || b[1].views - a[1].views)
    .slice(0, 8);
  let topJobs: Overview["topJobs"] = [];
  if (topIds.length) {
    const { data } = await db
      .from("external_jobs")
      .select("id, title, company_name")
      .in("id", topIds.map(([id]) => id));
    const byId = new Map((data ?? []).map((j) => [j.id, j]));
    topJobs = topIds.map(([id, stats]) => ({
      id,
      title: byId.get(id)?.title ?? "(deleted)",
      company: byId.get(id)?.company_name ?? "",
      ...stats,
    }));
  }

  const perDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    perDay.set(new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10), 0);
  }
  for (const row of publishedRes.data ?? []) {
    const day = row.published_at?.slice(0, 10);
    if (day && perDay.has(day)) perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }

  return {
    settings,
    counts,
    sources,
    views30d,
    clicks30d,
    saves30d,
    publishedPerDay: [...perDay.entries()].map(([day, count]) => ({ day, count })),
    topJobs,
    runs: (runsRes.data ?? []).map((r) => ({
      id: r.id,
      trigger: r.trigger,
      started_at: r.started_at,
      finished_at: r.finished_at,
      stats: r.stats ?? {},
      errorCount: Array.isArray(r.errors) ? r.errors.length : 0,
    })),
    openTakedowns: takedownRes.count ?? 0,
  };
}

export async function loadSources(db: AdminDb): Promise<Array<ExternalSourceRow & { publishedCount: number }>> {
  const [{ data: sources }, { data: published }] = await Promise.all([
    db.from("external_job_sources").select("*").order("company_name"),
    db.from("external_jobs").select("source_id").eq("status", "published").limit(20_000),
  ]);
  const counts = new Map<string, number>();
  for (const row of published ?? []) counts.set(row.source_id, (counts.get(row.source_id) ?? 0) + 1);
  return (sources ?? []).map((s) => ({ ...s, publishedCount: counts.get(s.id) ?? 0 }));
}

export async function loadJobsForTab(
  db: AdminDb,
  tab: string,
  q: string,
): Promise<ExternalJobRow[]> {
  const statuses = JOB_TABS[tab]?.statuses ?? ["published"];
  let query = db
    .from("external_jobs")
    .select("*")
    .in("status", statuses)
    .order("updated_at", { ascending: false })
    .limit(200);
  const clean = q.replace(/[%_,()]/g, " ").trim();
  if (clean) query = query.or(`title.ilike.%${clean}%,company_name.ilike.%${clean}%`);
  const { data } = await query;
  return data ?? [];
}

export async function loadEvents(db: AdminDb, opts: { jobId?: string; kind?: string; limit?: number }) {
  let query = db
    .from("external_job_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.jobId) query = query.eq("job_id", opts.jobId);
  if (opts.kind) query = query.eq("kind", opts.kind);
  const { data } = await query;
  return data ?? [];
}

export async function loadTakedowns(db: AdminDb) {
  const { data } = await db
    .from("external_job_takedowns")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function loadJobDetail(db: AdminDb, id: string) {
  const { data: job } = await db.from("external_jobs").select("*").eq("id", id).maybeSingle();
  if (!job) return null;
  const [{ data: source }, { data: snapshot }, events, engagement] = await Promise.all([
    db.from("external_job_sources").select("*").eq("id", job.source_id).maybeSingle(),
    db.from("external_job_snapshots").select("*").eq("job_id", id).maybeSingle(),
    loadEvents(db, { jobId: id, limit: 100 }),
    db.from("external_job_engagement").select("kind").eq("job_id", id).limit(50_000),
  ]);
  const stats = { views: 0, clicks: 0, saves: 0 };
  for (const e of engagement.data ?? []) {
    if (e.kind === "view") stats.views += 1;
    else if (e.kind === "apply_click") stats.clicks += 1;
    else stats.saves += 1;
  }
  return { job, source, snapshot, events, stats };
}

/** Compact read-only status for the protected cron endpoint (?status=1). */
export async function engineStatus() {
  const db = createAdminClient();
  if (!db) return { error: "SUPABASE_SERVICE_ROLE_KEY not configured" };
  const counts = Object.fromEntries(
    await Promise.all(ALL_STATUSES.map(async (s) => [s, await countStatus(db, s)] as const)),
  );
  const [{ data: runs }, { data: sources }, { data: reasons }] = await Promise.all([
    db
      .from("external_crawl_runs")
      .select("id, trigger, started_at, finished_at, stats, errors")
      .order("started_at", { ascending: false })
      .limit(5),
    db
      .from("external_job_sources")
      .select("company_name, status, publishing_paused, publishing_paused_reason, last_error, last_crawled_at"),
    db
      .from("external_jobs")
      .select("status_reason")
      .eq("status", "pending_review")
      .limit(500),
  ]);
  // Group pending reasons by their first clause so a systematic failure stands out.
  const pendingReasons: Record<string, number> = {};
  for (const row of reasons ?? []) {
    const key = (row.status_reason ?? "(none)").split(/[|:]/)[0].trim().slice(0, 80);
    pendingReasons[key] = (pendingReasons[key] ?? 0) + 1;
  }
  return { counts, sources, runs, pendingReasons };
}
