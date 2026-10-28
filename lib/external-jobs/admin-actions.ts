"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { hardPublishChecks, runExternalJobsCrawl, UNVERIFIABLE_PREFIX } from "@/lib/external-jobs/pipeline";
import { logEvent } from "@/lib/external-jobs/store";
import { executeTakedown } from "@/lib/external-jobs/takedown";
import { hostOf, jobFingerprint } from "@/lib/external-jobs/text";
import {
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  WORK_MODELS,
} from "@/lib/external-jobs/types";

const BASE = "/admin/external-jobs";

async function adminContext() {
  const { user } = await requireAdmin();
  const db = createAdminClient();
  if (!db) redirectWith(BASE, "SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return { db: db!, actor: user.email ?? user.id };
}

function redirectWith(path: string, msg: string): never {
  const url = new URL(path, "http://x");
  url.searchParams.set("msg", msg.slice(0, 300));
  redirect(`${url.pathname}${url.search}`);
}

function returnTo(formData: FormData, fallback: string): string {
  const value = String(formData.get("returnTo") ?? "");
  return value.startsWith(BASE) ? value : fallback;
}

function list(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

const sourceSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  careersUrl: z.string().trim().url().refine((v) => v.startsWith("https://"), "Careers URL must be https"),
  sourceType: z.enum(["greenhouse", "lever", "ashby", "workable", "smartrecruiters", "jsonld_sitemap"]),
  sourceKey: z.string().trim().min(1).max(500),
  collectionBasis: z.enum(["public_api", "public_feed", "structured_data", "written_permission"]),
  permissionNotes: z.string().trim().max(4000).optional().default(""),
  termsConfirmed: z.literal("on", { message: "Confirm that the source's terms allow this collection and use." }),
});

export async function addSourceAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const parsed = sourceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirectWith(`${BASE}?tab=sources`, parsed.error.issues.map((i) => i.message).join("; "));
  }
  const input = parsed.data;
  if (input.sourceType === "jsonld_sitemap") {
    const sitemapHost = hostOf(input.sourceKey);
    if (!sitemapHost || sitemapHost !== hostOf(input.careersUrl)) {
      redirectWith(`${BASE}?tab=sources`, "The sitemap URL must be on the careers site's own domain.");
    }
  }
  const careersHost = hostOf(input.careersUrl);
  const { data, error } = await db
    .from("external_job_sources")
    .insert({
      company_name: input.companyName,
      careers_url: input.careersUrl,
      source_type: input.sourceType,
      source_key: input.sourceKey,
      collection_basis: input.collectionBasis,
      permission_notes: input.permissionNotes || null,
      terms_reviewed_at: new Date().toISOString(),
      terms_reviewed_by: actor,
      company_domains: [...new Set([...(careersHost ? [careersHost] : []), ...list(formData.get("companyDomains"))])],
      allowed_apply_hosts: list(formData.get("allowedApplyHosts")),
      created_by: actor,
    })
    .select("id")
    .single();
  if (error || !data) redirectWith(`${BASE}?tab=sources`, error?.message ?? "Could not add source.");
  await logEvent(db, {
    kind: "source_added",
    sourceId: data.id,
    actor,
    message: `${input.companyName} via ${input.sourceType} (${input.sourceKey})`,
    detail: { basis: input.collectionBasis, notes: input.permissionNotes },
  });
  revalidatePath(BASE);
  redirectWith(`${BASE}?tab=sources`, `Added ${input.companyName}. It will be crawled on the next run (or use “Crawl now”).`);
}

export async function updateSourceAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const id = String(formData.get("sourceId") ?? "");
  const op = String(formData.get("op") ?? "");
  const back = returnTo(formData, `${BASE}?tab=sources`);
  const { data: source } = await db.from("external_job_sources").select("*").eq("id", id).maybeSingle();
  if (!source) redirectWith(back, "Source not found.");

  switch (op) {
    case "pause":
      await db.from("external_job_sources").update({ status: "paused" }).eq("id", id);
      // A paused source is no longer crawled, so its jobs can't be verified:
      // hide them. They come back on the first crawl after resuming.
      await db
        .from("external_jobs")
        .update({ status: "paused", status_reason: `${UNVERIFIABLE_PREFIX} source paused by ${actor}` })
        .eq("source_id", id)
        .eq("status", "published");
      break;
    case "resume":
      await db
        .from("external_job_sources")
        .update({ status: "active", consecutive_failures: 0, last_error: null })
        .eq("id", id);
      break;
    case "pause_publishing":
      await db
        .from("external_job_sources")
        .update({ publishing_paused: true, publishing_paused_reason: `Paused by ${actor}` })
        .eq("id", id);
      break;
    case "resume_publishing":
      await db
        .from("external_job_sources")
        .update({ publishing_paused: false, publishing_paused_reason: null })
        .eq("id", id);
      break;
    case "remove": {
      await db.from("external_job_sources").update({ status: "removed" }).eq("id", id);
      await db
        .from("external_jobs")
        .update({ status: "removed", status_reason: `Source removed by ${actor}` })
        .eq("source_id", id)
        .in("status", ["discovered", "pending_review", "published", "paused"]);
      break;
    }
    case "save": {
      const interval = Number.parseInt(String(formData.get("crawlIntervalHours") ?? ""), 10);
      const rate = Number.parseInt(String(formData.get("minRequestIntervalMs") ?? ""), 10);
      await db
        .from("external_job_sources")
        .update({
          crawl_interval_hours: Number.isFinite(interval) && interval >= 1 ? interval : source.crawl_interval_hours,
          min_request_interval_ms: Number.isFinite(rate) && rate >= 250 ? rate : source.min_request_interval_ms,
          company_domains: list(formData.get("companyDomains")),
          allowed_apply_hosts: list(formData.get("allowedApplyHosts")),
          permission_notes: String(formData.get("permissionNotes") ?? "").trim() || null,
        })
        .eq("id", id);
      break;
    }
    default:
      redirectWith(back, "Unknown action.");
  }
  await logEvent(db, { kind: "source_updated", sourceId: id, actor, message: `${source.company_name}: ${op}` });
  revalidatePath(BASE);
  redirectWith(back, `${source.company_name}: ${op.replace(/_/g, " ")} done.`);
}

export async function crawlNowAction(formData: FormData) {
  await adminContext();
  const sourceId = String(formData.get("sourceId") ?? "") || undefined;
  const back = returnTo(formData, `${BASE}?tab=sources`);
  // Server actions share the request time limit: keep a manual run short.
  const summary = await runExternalJobsCrawl({ trigger: "manual", sourceId, budgetMs: 50_000 });
  revalidatePath(BASE);
  if (summary.skipped) redirectWith(back, summary.skipped);
  const s = summary.stats;
  redirectWith(
    back,
    `Crawl done: ${s.jobsSeen} seen, ${s.discovered} new, ${s.published} published, ${s.updated} updated, ${s.pendingReview} to review, ${s.expired} expired${
      s.deferred ? `, ${s.deferred} deferred to next run` : ""
    }${summary.errors.length ? `, ${summary.errors.length} error(s)` : ""}.`,
  );
}

export async function settingsAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const field = String(formData.get("field") ?? "");
  const value = String(formData.get("value") ?? "") === "true";
  if (field !== "crawling_enabled" && field !== "auto_publish_enabled") {
    redirectWith(BASE, "Unknown setting.");
  }
  await db.from("external_jobs_settings").upsert({
    id: true,
    ...(field === "crawling_enabled" ? { crawling_enabled: value } : { auto_publish_enabled: value }),
    updated_at: new Date().toISOString(),
    updated_by: actor,
  });
  await logEvent(db, { kind: "settings_changed", actor, message: `${field} = ${value}` });
  revalidatePath(BASE);
  redirectWith(BASE, `${field === "crawling_enabled" ? "Daily crawling" : "Auto-publishing"} ${value ? "enabled" : "paused"}.`);
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function jobAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const id = String(formData.get("jobId") ?? "");
  const op = String(formData.get("op") ?? "");
  const back = returnTo(formData, `${BASE}/${id}`);
  const note = String(formData.get("note") ?? "").trim();
  const { data: job } = await db.from("external_jobs").select("*").eq("id", id).maybeSingle();
  if (!job) redirectWith(back, "Job not found.");

  const nowIso = new Date().toISOString();
  switch (op) {
    case "publish": {
      const { data: source } = await db
        .from("external_job_sources")
        .select("*")
        .eq("id", job.source_id)
        .single();
      if (!source) redirectWith(back, "Source missing.");
      // Rules 1, 6, 7: an admin can override content checks after reviewing,
      // but never a missing/closed apply link, a duplicate, or a source that
      // does not permit collection.
      const hard = await hardPublishChecks(db, source, job);
      if (!hard.ok) redirectWith(back, `Cannot publish: ${hard.problems.join(" · ")}`);
      const { error } = await db
        .from("external_jobs")
        .update({
          status: "published",
          status_reason: `Published manually by ${actor}${note ? `: ${note}` : ""}`,
          published_at: job.published_at ?? nowIso,
          last_verified_at: nowIso,
        })
        .eq("id", id);
      if (error) redirectWith(back, error.code === "23505" ? "An identical job is already published." : error.message);
      await logEvent(db, { kind: "manual_publish", jobId: id, sourceId: job.source_id, actor, message: note || null });
      break;
    }
    case "reject":
    case "pause":
    case "expire":
    case "remove": {
      const status = ({ reject: "rejected", pause: "paused", expire: "expired", remove: "removed" } as const)[op];
      await db
        .from("external_jobs")
        .update({
          status,
          status_reason: `${op} by ${actor}${note ? `: ${note}` : ""}`,
          ...(op === "expire" ? { expired_at: nowIso } : {}),
        })
        .eq("id", id);
      const kind = ({ reject: "rejected", pause: "paused", expire: "expired", remove: "removed" } as const)[op];
      await logEvent(db, { kind, jobId: id, sourceId: job.source_id, actor, message: note || null });
      break;
    }
    case "reprocess":
      await db
        .from("external_jobs")
        .update({
          status: "discovered",
          status_reason: `Queued for AI reprocessing by ${actor}`,
          content_hash: "pending",
          manually_edited: false,
        })
        .eq("id", id);
      await logEvent(db, { kind: "updated", jobId: id, sourceId: job.source_id, actor, message: "Queued for reprocessing" });
      break;
    default:
      redirectWith(back, "Unknown action.");
  }
  revalidatePath(BASE);
  revalidatePath(`/jobs/${id}`);
  redirectWith(back, `Job ${op} done.`);
}

const editSchema = z.object({
  title: z.string().trim().min(2).max(200),
  companyName: z.string().trim().min(1).max(200),
  location: z.string().trim().max(200),
  workModel: z.enum(["", ...WORK_MODELS]),
  employmentType: z.enum(["", ...EMPLOYMENT_TYPES]),
  seniority: z.string().trim().max(60),
  category: z.enum(JOB_CATEGORIES),
  summary: z.string().trim().min(20).max(3000),
  applyUrl: z.string().trim().url().refine((v) => v.startsWith("https://"), "Apply URL must be https"),
});

function lines(value: FormDataEntryValue | null, max = 15): string[] {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, max);
}

export async function editJobAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const id = String(formData.get("jobId") ?? "");
  const back = `${BASE}/${id}`;
  const parsed = editSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirectWith(back, parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  const input = parsed.data;
  const { data: before } = await db.from("external_jobs").select("*").eq("id", id).maybeSingle();
  if (!before) redirectWith(back, "Job not found.");

  const update = {
    title: input.title,
    company_name: input.companyName,
    location: input.location || null,
    work_model: input.workModel || null,
    employment_type: input.employmentType || null,
    seniority: input.seniority || null,
    category: input.category,
    summary: input.summary,
    apply_url: input.applyUrl,
    responsibilities: lines(formData.get("responsibilities")),
    requirements: lines(formData.get("requirements")),
    nice_to_have: lines(formData.get("niceToHave")),
    tags: lines(String(formData.get("tags") ?? "").replace(/,/g, "\n"), 12),
    fingerprint: jobFingerprint({ companyName: input.companyName, title: input.title, location: input.location || null }),
    manually_edited: true,
  };
  const { error } = await db.from("external_jobs").update(update).eq("id", id);
  if (error) redirectWith(back, error.code === "23505" ? "This edit would duplicate a published job." : error.message);

  const changed = Object.keys(update).filter(
    (key) => JSON.stringify((before as Record<string, unknown>)[key]) !== JSON.stringify((update as Record<string, unknown>)[key]),
  );
  await logEvent(db, {
    kind: "manual_edit",
    jobId: id,
    sourceId: before.source_id,
    actor,
    message: `Edited: ${changed.join(", ") || "no changes"}`,
    detail: Object.fromEntries(changed.map((k) => [k, { from: (before as Record<string, unknown>)[k], to: (update as Record<string, unknown>)[k] }])),
  });
  revalidatePath(BASE);
  revalidatePath(`/jobs/${id}`);
  redirectWith(back, "Saved.");
}

// ---------------------------------------------------------------------------
// Takedowns
// ---------------------------------------------------------------------------

export async function takedownAdminAction(formData: FormData) {
  const { db, actor } = await adminContext();
  const id = String(formData.get("takedownId") ?? "");
  const op = String(formData.get("op") ?? "");
  const back = `${BASE}?tab=takedowns`;
  if (op === "complete") {
    const { removed } = await executeTakedown(db, id, actor, "admin");
    revalidatePath(BASE);
    redirectWith(back, `Removal completed: ${removed} job(s) removed.`);
  }
  if (op === "reject") {
    await db
      .from("external_job_takedowns")
      .update({ status: "rejected", resolved_at: new Date().toISOString(), resolved_by: actor })
      .eq("id", id);
    revalidatePath(BASE);
    redirectWith(back, "Request rejected.");
  }
  redirectWith(back, "Unknown action.");
}
