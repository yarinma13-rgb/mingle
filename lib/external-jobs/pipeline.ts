import { createAdminClient } from "@/lib/supabase/admin";
import {
  aiAvailable,
  exportLearnedRpm,
  externalJobsModel,
  factCheckJob,
  importLearnedRpm,
  rewriteJob,
  type FactCheck,
} from "@/lib/external-jobs/ai";
import { sendEngineAlert } from "@/lib/external-jobs/alerts";
import { CONNECTORS } from "@/lib/external-jobs/connectors";
import { extractJobPostings, postingToRawJob } from "@/lib/external-jobs/connectors/jsonld";
import {
  PoliteFetcher,
  SourceAccessDenied,
  SourceTransientError,
} from "@/lib/external-jobs/http";
import { loadSettings, logEvent, logEvents, type AdminDb, type EngineSettings } from "@/lib/external-jobs/store";
import {
  jobFingerprint,
  normalizeForKey,
  rawContentHash,
} from "@/lib/external-jobs/text";
import type { ExternalJobRow, ExternalSourceRow, ProcessedJob, RawJob } from "@/lib/external-jobs/types";
import {
  failedChecks,
  sourcePermission,
  validateJob,
  type DuplicateCheck,
  type LinkCheck,
} from "@/lib/external-jobs/validate";
import type { ExternalJobStatus } from "@/lib/supabase/types";

/**
 * Source Discovery → Permission Check → Job Extraction → AI Rewriting →
 * Validation → Duplicate Check → Auto Publish → Daily Monitoring.
 */

const PENDING_HASH = "pending";
/** status_reason prefix for jobs the AI could not process; retried every run. */
export const AI_ERROR_PREFIX = "AI processing failed:";
/** Stop calling the AI for the rest of a run after this many failures in a row. */
const MAX_CONSECUTIVE_AI_ERRORS = 3;
/** A run that started this recently and hasn't finished blocks a new one. */
const RUN_LOCK_MS = 6 * 60_000;
/** Jobs absent from a complete official feed this many checks in a row are expired. */
const EXPIRE_AFTER_MISSES = 3;
/** Auto-pause a source's publishing when this share of processed jobs fails checks. */
const FAILURE_PAUSE_RATIO = 0.5;
const FAILURE_PAUSE_MIN_JOBS = 4;
const ACTIVE_STATUSES: ExternalJobStatus[] = ["discovered", "pending_review", "published", "paused"];

/**
 * Prefix of status_reason for jobs the engine itself hid because it could not
 * verify them; the engine may un-hide those. Any other paused job was hidden
 * by an admin and stays hidden until an admin acts.
 */
export const UNVERIFIABLE_PREFIX = "Unverifiable:";

export function isAdminHidden(row: Pick<ExternalJobRow, "status" | "status_reason">): boolean {
  return row.status === "paused" && !row.status_reason?.startsWith(UNVERIFIABLE_PREFIX);
}

export type RunStats = {
  sourcesCrawled: number;
  sourcesFailed: number;
  jobsSeen: number;
  discovered: number;
  processed: number;
  published: number;
  updated: number;
  pendingReview: number;
  rejected: number;
  expired: number;
  paused: number;
  deferred: number;
  aiErrors: number;
  requests: number;
};

export type RunSummary = {
  runId: string | null;
  skipped?: string;
  stats: RunStats;
  errors: Array<{ sourceId: string; company: string; message: string }>;
};

function emptyStats(): RunStats {
  return {
    sourcesCrawled: 0,
    sourcesFailed: 0,
    jobsSeen: 0,
    discovered: 0,
    processed: 0,
    published: 0,
    updated: 0,
    pendingReview: 0,
    rejected: 0,
    expired: 0,
    paused: 0,
    deferred: 0,
    aiErrors: 0,
    requests: 0,
  };
}

function aiBudget(): number {
  const value = Number.parseInt(process.env.EXTERNAL_JOBS_MAX_AI_PER_RUN ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : 30;
}

function aiConcurrency(): number {
  const value = Number.parseInt(process.env.EXTERNAL_JOBS_AI_CONCURRENCY ?? "", 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 8) : 4;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Save the run's counters as it goes, so a run the platform cuts off still
 * shows what it did. Throttled to one write every few seconds.
 */
async function saveRunProgress(ctx: RunContext, force = false): Promise<void> {
  if (!ctx.runId) return;
  const now = Date.now();
  if (!force && now - ctx.lastProgressSave < 3000) return;
  ctx.lastProgressSave = now;
  await ctx.db
    .from("external_crawl_runs")
    .update({ stats: runStats(ctx), errors: ctx.errors })
    .eq("id", ctx.runId);
}

/** Counters plus the learned AI pacing ("rpm:<model>") for the next run. */
function runStats(ctx: RunContext): Record<string, number> {
  const pacing = Object.fromEntries(
    Object.entries(exportLearnedRpm()).map(([model, rpm]) => [`rpm:${model}`, rpm]),
  );
  return { ...(ctx.stats as unknown as Record<string, number>), ...pacing };
}

function isDue(source: ExternalSourceRow, now: number): boolean {
  if (!source.last_crawled_at) return true;
  // 1h slack so a daily cron that drifts a few minutes still picks it up.
  const dueAt =
    new Date(source.last_crawled_at).getTime() + (source.crawl_interval_hours - 1) * 3_600_000;
  return now >= dueAt;
}

type RunContext = {
  db: AdminDb;
  runId: string | null;
  settings: EngineSettings;
  stats: RunStats;
  errors: RunSummary["errors"];
  deadline: number;
  aiLeft: number;
  aiErrorsInARow: number;
  aiErrorAlerted: boolean;
  lastProgressSave: number;
};

export async function runExternalJobsCrawl(opts: {
  trigger: "cron" | "manual";
  sourceId?: string;
  /** Crawl every active source now, even if its interval hasn't passed. */
  force?: boolean;
  /** Stop starting new work after this many ms (serverless time limit). */
  budgetMs?: number;
  /** Tests inject an in-memory client; production uses the service role. */
  db?: AdminDb;
}): Promise<RunSummary> {
  const stats = emptyStats();
  const db = opts.db ?? createAdminClient();
  if (!db) {
    return { runId: null, skipped: "SUPABASE_SERVICE_ROLE_KEY not configured", stats, errors: [] };
  }

  const settings = await loadSettings(db);
  if (!settings.crawlingEnabled && opts.trigger === "cron") {
    return { runId: null, skipped: "Crawling is paused in the admin dashboard.", stats, errors: [] };
  }

  // Two runs on the same source would race on inserts: allow one at a time.
  const { data: running } = await db
    .from("external_crawl_runs")
    .select("id")
    .is("finished_at", null)
    .gte("started_at", new Date(Date.now() - RUN_LOCK_MS).toISOString())
    .limit(1);
  if (running?.length) {
    return { runId: null, skipped: "Another crawl is already running. Try again in a few minutes.", stats, errors: [] };
  }

  // Start at the AI pace earlier runs learned (stored as "rpm:<model>").
  const { data: lastRuns } = await db
    .from("external_crawl_runs")
    .select("stats")
    .order("started_at", { ascending: false })
    .limit(5);
  for (const previous of lastRuns ?? []) {
    importLearnedRpm(
      Object.fromEntries(
        Object.entries(previous.stats ?? {})
          .filter(([key]) => key.startsWith("rpm:"))
          .map(([key, value]) => [key.slice(4), Number(value)]),
      ),
    );
  }

  const { data: run } = await db
    .from("external_crawl_runs")
    .insert({ trigger: opts.trigger })
    .select("id")
    .single();
  const ctx: RunContext = {
    db,
    runId: run?.id ?? null,
    settings,
    stats,
    errors: [],
    deadline: Date.now() + (opts.budgetMs ?? 240_000),
    aiLeft: aiBudget(),
    aiErrorsInARow: 0,
    aiErrorAlerted: false,
    lastProgressSave: 0,
  };
  await logEvent(db, { kind: "crawl_started", runId: ctx.runId, message: opts.trigger });

  let query = db.from("external_job_sources").select("*").eq("status", "active");
  if (opts.sourceId) query = query.eq("id", opts.sourceId);
  const { data: sources, error } = await query.order("last_crawled_at", {
    ascending: true,
    nullsFirst: true,
  });
  if (error) {
    ctx.errors.push({ sourceId: "-", company: "-", message: error.message });
  }

  const now = Date.now();
  for (const source of sources ?? []) {
    if (Date.now() > ctx.deadline) break;
    if (!opts.sourceId && !opts.force && !isDue(source, now)) continue;
    await crawlSource(ctx, source);
  }

  if (ctx.runId) {
    await db
      .from("external_crawl_runs")
      .update({
        finished_at: new Date().toISOString(),
        stats: runStats(ctx),
        errors: ctx.errors,
      })
      .eq("id", ctx.runId);
  }
  await logEvent(db, { kind: "crawl_finished", runId: ctx.runId, detail: stats });

  if (ctx.errors.length) {
    await sendEngineAlert(
      `${ctx.errors.length} source error(s) in the daily crawl`,
      ctx.errors.map((e) => `${e.company}: ${e.message}`),
    );
  }

  return { runId: ctx.runId, stats, errors: ctx.errors };
}

async function crawlSource(ctx: RunContext, source: ExternalSourceRow) {
  const { db } = ctx;
  const connector = CONNECTORS[source.source_type];
  const fetcher = new PoliteFetcher({ minIntervalMs: source.min_request_interval_ms, deadline: ctx.deadline });
  const nowIso = new Date().toISOString();

  // --- Permission check ---------------------------------------------------
  if (!source.terms_reviewed_at) {
    await logEvent(db, {
      kind: "permission_blocked",
      sourceId: source.id,
      runId: ctx.runId,
      message: "Terms of use not reviewed; source skipped.",
    });
    return;
  }

  const endpoint = connector.endpoint(source);
  const robots = await fetcher.robotsStatus(endpoint);
  if (robots.state === "unreachable") {
    // An outage, not a ban: count a failure and try again next run.
    await failSource(ctx, source, robots.reason, { pauseSource: false });
    ctx.stats.requests += fetcher.requests;
    return;
  }
  const robotsAllowed = robots.state === "allowed";
  await db
    .from("external_job_sources")
    .update({ robots_allowed: robotsAllowed, robots_checked_at: nowIso })
    .eq("id", source.id);
  source.robots_allowed = robotsAllowed;
  if (!robotsAllowed) {
    const message = `robots.txt disallows ${endpoint}. Collection stopped; published jobs paused.`;
    await failSource(ctx, source, message, { pauseSource: true });
    return;
  }

  // --- Extraction ----------------------------------------------------------
  let result;
  try {
    result = await connector.list(source, fetcher);
  } catch (error) {
    const blocked = error instanceof SourceAccessDenied;
    const message = error instanceof Error ? error.message : "Unknown source error";
    await failSource(ctx, source, message, { pauseSource: blocked });
    ctx.stats.requests += fetcher.requests;
    return;
  }
  ctx.stats.sourcesCrawled += 1;
  ctx.stats.jobsSeen += result.jobs.length;

  const { data: existingRows } = await db
    .from("external_jobs")
    .select("*")
    .eq("source_id", source.id)
    .in("status", ACTIVE_STATUSES);
  const existing = new Map((existingRows ?? []).map((row) => [row.external_id, row]));

  const unique: RawJob[] = [];
  const seen = new Set<string>();
  for (const raw of result.jobs) {
    if (seen.has(raw.externalId)) continue;
    seen.add(raw.externalId);
    unique.push(raw);
  }

  // --- Pass 1: bookkeeping in a handful of bulk queries ---------------------
  // (One query per job used to eat most of the run's time limit.)
  const rows = new Map<string, ExternalJobRow>();
  for (const raw of unique) {
    const row = existing.get(raw.externalId);
    if (row) rows.set(raw.externalId, row);
  }

  // Jobs we decided on before (rejected/removed) keep that decision; an
  // expired job that is listed again is processed again.
  const unknown = unique.filter((raw) => !rows.has(raw.externalId));
  const priors = new Map<string, { id: string; status: ExternalJobStatus }>();
  for (const ids of chunk(unknown.map((raw) => raw.externalId), 200)) {
    const { data } = await db
      .from("external_jobs")
      .select("id, status, external_id")
      .eq("source_id", source.id)
      .in("external_id", ids);
    for (const prior of data ?? []) priors.set(prior.external_id, prior);
  }

  const toInsert: RawJob[] = [];
  for (const raw of unknown) {
    const prior = priors.get(raw.externalId);
    if (!prior) {
      toInsert.push(raw);
    } else if (prior.status === "expired") {
      const { data: reopened } = await db
        .from("external_jobs")
        .update({ status: "discovered", status_reason: "Re-opened on source", expired_at: null, content_hash: PENDING_HASH })
        .eq("id", prior.id)
        .select("*")
        .single();
      if (reopened) rows.set(raw.externalId, reopened);
    }
  }

  for (const batch of chunk(toInsert, 100)) {
    const { data: inserted, error } = await db
      .from("external_jobs")
      .insert(
        batch.map((raw) => ({
          source_id: source.id,
          external_id: raw.externalId,
          fingerprint: jobFingerprint(raw),
          content_hash: PENDING_HASH,
          status: "discovered" as const,
          company_name: raw.companyName,
          title: raw.title,
          location: raw.location,
          work_model: raw.workModelHint,
          employment_type: raw.employmentTypeHint,
          department: raw.department,
          apply_url: raw.applyUrl,
          source_url: raw.sourceUrl,
          source_posted_at: raw.postedAt,
          source_updated_at: raw.updatedAt,
        })),
      )
      .select("*");
    if (error) {
      ctx.errors.push({ sourceId: source.id, company: source.company_name, message: `insert failed: ${error.message}` });
      continue;
    }
    for (const row of inserted ?? []) rows.set(row.external_id, row);
    ctx.stats.discovered += inserted?.length ?? 0;
    await logEvents(
      db,
      (inserted ?? []).map((row) => ({
        kind: "discovered" as const,
        jobId: row.id,
        sourceId: source.id,
        runId: ctx.runId,
        message: row.title,
      })),
    );
  }

  const rawById = new Map(unique.map((raw) => [raw.externalId, raw]));
  for (const batch of chunk([...rows.values()], 50)) {
    await db.from("external_job_snapshots").upsert(
      batch.map((row) => {
        const raw = rawById.get(row.external_id)!;
        return { job_id: row.id, source_text: raw.text, source_payload: raw.payload, fetched_at: nowIso };
      }),
    );
  }

  // Seen in the official feed: it's open. Clear any verification misses.
  const touch = {
    last_seen_at: nowIso,
    last_verified_at: nowIso,
    verify_failures: 0,
  };
  const touchIds: string[] = [];
  const toProcess: Array<{ row: ExternalJobRow; raw: RawJob; hash: string }> = [];

  for (const raw of unique) {
    const row = rows.get(raw.externalId);
    if (!row) continue;
    const hash = rawContentHash(raw);

    if (isAdminHidden(row)) {
      // Hidden by an admin: keep tracking availability, never touch content or status.
      touchIds.push(row.id);
      continue;
    }

    // Jobs the AI failed on are retried even if the source didn't change.
    const retryAi = row.status === "pending_review" && Boolean(row.status_reason?.startsWith(AI_ERROR_PREFIX));

    if (row.content_hash === hash && !retryAi) {
      if (row.status === "paused" && row.status_reason?.startsWith(UNVERIFIABLE_PREFIX)) {
        const canPublish = ctx.settings.autoPublishEnabled && !source.publishing_paused;
        await db
          .from("external_jobs")
          .update({
            ...touch,
            status: canPublish ? "published" : "pending_review",
            status_reason: canPublish ? null : "Availability confirmed again; auto-publishing is paused.",
          })
          .eq("id", row.id);
        await logEvent(db, { kind: "resumed", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: "Availability confirmed again" });
      } else {
        touchIds.push(row.id);
      }
      continue;
    }

    if (row.manually_edited && row.content_hash !== PENDING_HASH && !retryAi) {
      // Never silently overwrite an admin's edit: send it back for review.
      await db
        .from("external_jobs")
        .update({
          ...touch,
          status: "pending_review",
          status_reason: "Source changed after a manual edit. Review the new source text.",
          content_hash: hash,
        })
        .eq("id", row.id);
      ctx.stats.pendingReview += 1;
      await logEvent(db, { kind: "validation_failed", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: "Source changed after manual edit" });
      continue;
    }

    toProcess.push({ row, raw, hash });
  }

  for (const ids of chunk(touchIds, 200)) {
    await db.from("external_jobs").update(touch).in("id", ids);
  }
  await saveRunProgress(ctx);

  // --- Pass 2: AI processing, a few jobs at a time --------------------------
  let processedHere = 0;
  let failedHere = 0;
  let next = 0;
  const worker = async () => {
    for (;;) {
      if (ctx.aiLeft <= 0 || Date.now() > ctx.deadline) return;
      const item = toProcess[next++];
      if (!item) return;
      const outcome = await processJob(ctx, source, item.row, item.raw, item.hash, fetcher);
      // An AI outage says nothing about this source's jobs: it doesn't count
      // toward pausing the source.
      if (outcome !== "ai_error") processedHere += 1;
      if (outcome === "failed") failedHere += 1;
      await saveRunProgress(ctx);
    }
  };
  await Promise.all(Array.from({ length: aiConcurrency() }, worker));

  // Not reached this run: leave content_hash stale so the next run picks them up.
  const deferred = toProcess.slice(next);
  ctx.stats.deferred += deferred.length;
  for (const ids of chunk(deferred.map((item) => item.row.id), 200)) {
    await db.from("external_jobs").update(touch).in("id", ids);
  }

  // --- Monitoring: jobs that disappeared from the source -------------------
  for (const row of existing.values()) {
    if (seen.has(row.external_id)) continue;
    if (Date.now() > ctx.deadline) break;
    await handleMissingJob(ctx, source, row, result.complete, fetcher);
  }

  // --- Rule 10: pause auto-publishing when mandatory checks keep failing ---
  if (
    processedHere >= FAILURE_PAUSE_MIN_JOBS &&
    failedHere / processedHere >= FAILURE_PAUSE_RATIO &&
    !source.publishing_paused
  ) {
    const reason = `${failedHere}/${processedHere} jobs failed mandatory checks in the last crawl.`;
    await db
      .from("external_job_sources")
      .update({ publishing_paused: true, publishing_paused_reason: reason })
      .eq("id", source.id);
    await logEvent(db, { kind: "publishing_paused", sourceId: source.id, runId: ctx.runId, message: reason });
    await sendEngineAlert(`Auto-publishing paused for ${source.company_name}`, [reason]);
  }

  ctx.stats.requests += fetcher.requests;
  await db
    .from("external_job_sources")
    .update({
      last_crawled_at: nowIso,
      last_success_at: nowIso,
      last_error: null,
      consecutive_failures: 0,
    })
    .eq("id", source.id);
}

async function failSource(
  ctx: RunContext,
  source: ExternalSourceRow,
  message: string,
  opts: { pauseSource: boolean },
) {
  const { db } = ctx;
  const failures = source.consecutive_failures + 1;
  ctx.stats.sourcesFailed += 1;
  ctx.errors.push({ sourceId: source.id, company: source.company_name, message });
  await db
    .from("external_job_sources")
    .update({
      last_crawled_at: new Date().toISOString(),
      last_error: message,
      consecutive_failures: failures,
      ...(opts.pauseSource ? { status: "paused" as const } : {}),
    })
    .eq("id", source.id);
  await logEvent(db, {
    kind: opts.pauseSource ? "source_blocked" : "source_error",
    sourceId: source.id,
    runId: ctx.runId,
    message,
  });

  // A blocked source, or one failing 3 days running, can no longer verify its
  // jobs: hide them until it can.
  if (opts.pauseSource || failures >= 3) {
    const { data: paused } = await db
      .from("external_jobs")
      .update({ status: "paused", status_reason: `${UNVERIFIABLE_PREFIX} ${message}`.slice(0, 500) })
      .eq("source_id", source.id)
      .eq("status", "published")
      .select("id");
    ctx.stats.paused += paused?.length ?? 0;
    for (const job of paused ?? []) {
      await logEvent(db, { kind: "paused", jobId: job.id, sourceId: source.id, runId: ctx.runId, message: "Source unverifiable" });
    }
  }
}

// ---------------------------------------------------------------------------
// Per-job processing.
// ---------------------------------------------------------------------------

export async function checkApplyLink(
  fetcher: PoliteFetcher,
  url: string,
  title: string,
  listedByOfficialApi: boolean,
): Promise<LinkCheck> {
  const evidence = listedByOfficialApi
    ? " Listed with this URL by the company's official job-board API in this crawl."
    : "";
  try {
    const robots = await fetcher.robotsStatus(url);
    if (robots.state !== "allowed") {
      const why =
        robots.state === "unreachable"
          ? `Could not read robots.txt for the apply page (${robots.reason}).`
          : "robots.txt disallows fetching the apply page.";
      return {
        ok: listedByOfficialApi,
        gone: false,
        detail: `${why}${evidence || " Could not verify."}`,
      };
    }
    const page = await fetcher.get(url, { accept: "text/html" });
    if (page.status === 404 || page.status === 410) {
      return { ok: false, gone: true, detail: `Apply page returned ${page.status}: job is closed.` };
    }
    if (page.status >= 400) {
      return { ok: false, gone: false, detail: `Apply page returned ${page.status}.` };
    }
    if (/["']?(isGone|jobClosed|job_closed)["']?\s*:\s*true/i.test(page.body)) {
      return { ok: false, gone: true, detail: "Apply page says the job is closed." };
    }
    const titleWords = normalizeForKey(title).split(" ").filter((w) => w.length > 3);
    const body = normalizeForKey(page.body.slice(0, 400_000));
    const mentions = titleWords.length === 0 || titleWords.some((w) => body.includes(w));
    if (!mentions && !listedByOfficialApi) {
      return { ok: false, gone: false, detail: "Apply page loads but does not mention this job." };
    }
    return { ok: true, gone: false, detail: `Apply page loads (${page.status}).${mentions ? " Mentions the job title." : evidence}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unreachable";
    return {
      ok: listedByOfficialApi && !(error instanceof SourceTransientError),
      gone: false,
      detail: `Could not load apply page (${message}).${evidence}`,
    };
  }
}

export async function findDuplicate(
  db: AdminDb,
  jobId: string,
  fingerprint: string,
  companyName: string,
  title: string,
): Promise<DuplicateCheck> {
  const { data: published } = await db
    .from("external_jobs")
    .select("id, title, company_name")
    .eq("fingerprint", fingerprint)
    .eq("status", "published")
    .neq("id", jobId)
    .limit(1);
  if (published?.length) {
    return { duplicate: true, detail: `Same job already published (${published[0].id}).` };
  }

  // A company that manages its own jobs on mingle always takes precedence.
  const { data: companies } = await db
    .from("company_profiles")
    .select("user_id, company_name")
    .ilike("company_name", companyName.replace(/[%_]/g, ""));
  const ids = (companies ?? [])
    .filter((c) => normalizeForKey(c.company_name) === normalizeForKey(companyName))
    .map((c) => c.user_id);
  if (ids.length) {
    const { data: roles } = await db
      .from("roles")
      .select("id, title")
      .in("company_id", ids)
      .eq("status", "open");
    const match = (roles ?? []).find((r) => normalizeForKey(r.title) === normalizeForKey(title));
    if (match) {
      return { duplicate: true, detail: "The company already publishes this role on mingle itself." };
    }
  }
  return { duplicate: false, detail: "No identical published job." };
}

/** Drop tags the source does not support, so search never surfaces invented skills. */
export function supportedTags(tags: string[], raw: RawJob, category: string): string[] {
  const haystack = normalizeForKey(`${raw.title} ${raw.department ?? ""} ${raw.text} ${category}`);
  return tags.filter((tag) => {
    const key = normalizeForKey(tag);
    return key !== "" && key.split(" ").every((word) => haystack.includes(word));
  });
}

type ProcessOutcome = "published" | "failed" | "rejected" | "ai_error";

async function processJob(
  ctx: RunContext,
  source: ExternalSourceRow,
  row: ExternalJobRow,
  raw: RawJob,
  hash: string,
  fetcher: PoliteFetcher,
): Promise<ProcessOutcome> {
  const { db } = ctx;
  const nowIso = new Date().toISOString();
  ctx.aiLeft -= 1;
  ctx.stats.processed += 1;
  const wasPublished = row.status === "published";

  let processed: ProcessedJob | null = null;
  let factCheck: FactCheck | null = null;
  let aiError: string | null = null;
  if (!aiAvailable()) {
    aiError = "GEMINI_API_KEY is not configured.";
  } else {
    try {
      processed = await rewriteJob(raw);
      processed.tags = supportedTags(processed.tags, raw, processed.category);
      factCheck = await factCheckJob(raw, processed);
    } catch (error) {
      // Either call failing means the content wasn't verified: treat both alike.
      processed = null;
      aiError = error instanceof Error ? error.message : "AI processing failed";
    }
  }

  if (!processed) {
    // Not published, not a content problem: keep the hash pending so the next
    // run retries it, and stop hammering a broken AI for the rest of this run.
    await db
      .from("external_jobs")
      .update({
        status: row.status === "published" ? "published" : "pending_review",
        status_reason: row.status === "published" ? row.status_reason : `${AI_ERROR_PREFIX} ${aiError}`.slice(0, 500),
        last_seen_at: nowIso,
        processed_at: nowIso,
        content_hash: PENDING_HASH,
      })
      .eq("id", row.id);
    ctx.stats.aiErrors += 1;
    // Surface the first AI error of the run (summary, cron response, alert).
    if (ctx.stats.aiErrors === 1) {
      ctx.errors.push({
        sourceId: source.id,
        company: source.company_name,
        message: `AI (${externalJobsModel()}): ${aiError}`.slice(0, 500),
      });
    }
    await logEvent(db, { kind: "ai_error", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: aiError });
    ctx.aiErrorsInARow += 1;
    if (ctx.aiErrorsInARow >= MAX_CONSECUTIVE_AI_ERRORS) {
      ctx.aiLeft = 0;
      if (!ctx.aiErrorAlerted) {
        ctx.aiErrorAlerted = true;
        await sendEngineAlert("AI processing is failing", [
          `${ctx.aiErrorsInARow} AI calls failed in a row (model ${externalJobsModel()}). Processing stopped for this run; jobs will be retried next run.`,
          `Last error: ${aiError}`,
        ]);
      }
    }
    return "ai_error";
  }
  ctx.aiErrorsInARow = 0;

  const fingerprint = jobFingerprint(processed);
  const duplicate = await findDuplicate(db, row.id, fingerprint, processed.companyName, processed.title);
  const listedByApi = source.source_type !== "jsonld_sitemap";
  const link = await checkApplyLink(fetcher, raw.applyUrl, raw.title, listedByApi);
  const checks = validateJob({ source, raw, processed, factCheck, link, duplicate });
  const failed = failedChecks(checks);

  let status: ExternalJobStatus;
  let reason: string | null = null;
  if (failed.length === 0) {
    if (ctx.settings.autoPublishEnabled && !source.publishing_paused) {
      status = "published";
    } else {
      status = "pending_review";
      reason = source.publishing_paused
        ? `Passed all checks; auto-publishing is paused for this source (${source.publishing_paused_reason ?? "manual"}).`
        : "Passed all checks; auto-publishing is paused globally.";
    }
  } else if (failed.length === 1 && failed[0].id === "no_duplicate") {
    status = "rejected";
    reason = `Duplicate: ${failed[0].detail}`;
  } else if (failed.some((c) => c.id === "job_open")) {
    status = "expired";
    reason = failed.find((c) => c.id === "job_open")?.detail ?? "Closed";
  } else {
    status = "pending_review";
    reason = failed.map((c) => `${c.label}: ${c.detail}`).join(" | ").slice(0, 1000);
  }

  const update = {
    fingerprint,
    content_hash: hash,
    status,
    status_reason: reason,
    company_name: processed.companyName,
    title: processed.title,
    location: processed.location,
    work_model: processed.workModel,
    employment_type: processed.employmentType,
    seniority: processed.seniority,
    department: processed.department,
    category: processed.category,
    source_language: processed.sourceLanguage,
    summary: processed.summary,
    responsibilities: processed.responsibilities,
    requirements: processed.requirements,
    nice_to_have: processed.niceToHave,
    tags: processed.tags,
    apply_url: raw.applyUrl,
    source_url: raw.sourceUrl,
    validation: checks,
    ai_model: processed.model ?? externalJobsModel(),
    source_posted_at: raw.postedAt,
    source_updated_at: raw.updatedAt,
    last_seen_at: nowIso,
    last_verified_at: nowIso,
    processed_at: nowIso,
    published_at: status === "published" ? (row.published_at ?? nowIso) : row.published_at,
    expired_at: status === "expired" ? nowIso : null,
  };

  const { error } = await db.from("external_jobs").update(update).eq("id", row.id);
  if (error) {
    // 23505: the published-fingerprint unique index caught a concurrent duplicate.
    const rejected = error.code === "23505";
    await db
      .from("external_jobs")
      .update({
        ...update,
        status: rejected ? "rejected" : "pending_review",
        status_reason: rejected ? "Duplicate of a job published concurrently." : error.message,
        published_at: row.published_at,
      })
      .eq("id", row.id);
    if (rejected) ctx.stats.rejected += 1;
    else ctx.stats.pendingReview += 1;
    await logEvent(db, { kind: rejected ? "duplicate" : "validation_failed", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: error.message });
    return rejected ? "rejected" : "failed";
  }

  const detail = { checks, factCheck, aiModel: processed.model ?? externalJobsModel() };
  await logEvent(db, { kind: "processed", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: `${processed.title} → ${status}`, detail });

  if (status === "published") {
    if (wasPublished) ctx.stats.updated += 1;
    else ctx.stats.published += 1;
    await logEvent(db, {
      kind: wasPublished ? "updated" : "published",
      jobId: row.id,
      sourceId: source.id,
      runId: ctx.runId,
      message: wasPublished ? "Updated from changed source content" : "Auto-published",
    });
    return "published";
  }
  if (status === "rejected") {
    ctx.stats.rejected += 1;
    await logEvent(db, { kind: "duplicate", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: reason });
    return "rejected";
  }
  if (status === "expired") {
    ctx.stats.expired += 1;
    await logEvent(db, { kind: "expired", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: reason });
    return "failed";
  }
  ctx.stats.pendingReview += 1;
  await logEvent(db, { kind: "validation_failed", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: reason });
  return "failed";
}

// ---------------------------------------------------------------------------
// Monitoring of jobs that are no longer in the source listing.
// ---------------------------------------------------------------------------

async function handleMissingJob(
  ctx: RunContext,
  source: ExternalSourceRow,
  row: ExternalJobRow,
  listingComplete: boolean,
  fetcher: PoliteFetcher,
) {
  const { db } = ctx;
  const nowIso = new Date().toISOString();

  const expire = async (reason: string) => {
    await db
      .from("external_jobs")
      .update({ status: "expired", status_reason: reason, expired_at: nowIso })
      .eq("id", row.id);
    ctx.stats.expired += 1;
    await logEvent(db, { kind: "expired", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: reason });
  };

  // Never published: nothing to verify, just drop it from the queues.
  if (row.status === "discovered" || row.status === "pending_review") {
    if (listingComplete) await expire("No longer listed on the source.");
    return;
  }

  // Published / paused: confirm before removing.
  const verdict = await verifyStillOpen(fetcher, source, row);
  if (verdict === "open") {
    if (listingComplete) {
      // Page loads but the official feed no longer lists it: can't vouch for it.
      await markUnverifiable(ctx, source, row, "Missing from the official job feed but the page still loads.");
    } else {
      await db
        .from("external_jobs")
        .update({ last_verified_at: nowIso, verify_failures: 0 })
        .eq("id", row.id);
    }
    return;
  }
  if (verdict === "closed") {
    await expire("Verified closed on the official site.");
    return;
  }
  await markUnverifiable(ctx, source, row, "Could not verify availability.");
}

async function markUnverifiable(
  ctx: RunContext,
  source: ExternalSourceRow,
  row: ExternalJobRow,
  why: string,
) {
  const failures = row.verify_failures + 1;
  const adminHidden = isAdminHidden(row);
  if (failures >= EXPIRE_AFTER_MISSES) {
    await ctx.db
      .from("external_jobs")
      .update({
        status: "expired",
        status_reason: `${why} (${failures} checks in a row)`,
        expired_at: new Date().toISOString(),
        verify_failures: failures,
      })
      .eq("id", row.id);
    ctx.stats.expired += 1;
    await logEvent(ctx.db, { kind: "expired", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: why });
    return;
  }
  await ctx.db
    .from("external_jobs")
    .update(
      adminHidden
        ? { verify_failures: failures }
        : { status: "paused", status_reason: `${UNVERIFIABLE_PREFIX} ${why}`, verify_failures: failures },
    )
    .eq("id", row.id);
  if (row.status === "published") {
    ctx.stats.paused += 1;
    await logEvent(ctx.db, { kind: "paused", jobId: row.id, sourceId: source.id, runId: ctx.runId, message: why });
  }
}

export async function verifyStillOpen(
  fetcher: PoliteFetcher,
  source: ExternalSourceRow,
  row: Pick<ExternalJobRow, "source_url" | "title" | "external_id">,
): Promise<"open" | "closed" | "unknown"> {
  try {
    if (!(await fetcher.isAllowed(row.source_url))) return "unknown";
    const page = await fetcher.get(row.source_url, { accept: "text/html" });
    if (page.status === 404 || page.status === 410) return "closed";
    if (page.status >= 400) return "unknown";
    if (source.source_type === "jsonld_sitemap") {
      const postings = extractJobPostings(page.body);
      if (postings.length === 0) return "closed";
      const live = postings.some((p) => postingToRawJob(p, page.url, source.company_name) != null);
      return live ? "open" : "closed";
    }
    // ATS boards redirect a closed job back to the board index.
    const requested = new URL(row.source_url);
    const landed = new URL(page.url);
    if (requested.pathname !== landed.pathname && !landed.pathname.includes(row.external_id)) {
      return "closed";
    }
    return "open";
  } catch {
    // Blocked, robots or network: can't tell either way.
    return "unknown";
  }
}

/** Shared by manual admin publish: the two checks that can never be overridden. */
export async function hardPublishChecks(
  db: AdminDb,
  source: ExternalSourceRow,
  job: ExternalJobRow,
): Promise<{ ok: boolean; problems: string[] }> {
  const problems: string[] = [];
  const permission = sourcePermission(source);
  if (!permission.ok) problems.push(permission.detail);
  if (!job.apply_url.startsWith("https://")) {
    problems.push("Apply link must be https.");
  } else {
    // Same evidence rule as auto-publish: an ATS job seen in the official
    // feed within the last two days counts as listed by the official API.
    const listedByApi =
      source.source_type !== "jsonld_sitemap" &&
      Date.now() - new Date(job.last_seen_at).getTime() < 48 * 3_600_000;
    const fetcher = new PoliteFetcher({ minIntervalMs: source.min_request_interval_ms });
    const link = await checkApplyLink(fetcher, job.apply_url, job.title, listedByApi);
    if (link.gone) problems.push(link.detail);
    else if (!link.ok) problems.push(`Apply link not verified: ${link.detail}`);
  }
  const duplicate = await findDuplicate(db, job.id, job.fingerprint, job.company_name, job.title);
  if (duplicate.duplicate) problems.push(duplicate.detail);
  return { ok: problems.length === 0, problems };
}
