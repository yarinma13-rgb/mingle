import { randomBytes } from "node:crypto";
import { Resend } from "resend";
import { z } from "zod";
import { appOrigin } from "@/lib/app-origin";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEngineAlert } from "@/lib/external-jobs/alerts";
import { ATS_APPLY_HOSTS } from "@/lib/external-jobs/connectors";
import { logEvent, type AdminDb } from "@/lib/external-jobs/store";
import { hostMatchesAny, hostOf, normalizeForKey, sha256 } from "@/lib/external-jobs/text";
import type { ExternalSourceRow } from "@/lib/external-jobs/types";

/*
 * Company removal requests (spec §5, rule 9). A request is verified by
 * proving control of an email address on the company's own domain: the
 * engine emails a one-time link, and clicking it removes the job(s) at once
 * and stops collection for a company-wide request. Requests from other
 * domains go to an admin queue instead of being executed automatically.
 */

export const takedownSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  requesterName: z.string().trim().max(120).optional().default(""),
  requesterEmail: z.string().trim().toLowerCase().email().max(200),
  jobId: z.string().uuid().optional().or(z.literal("")).default(""),
  scope: z.enum(["job", "company"]),
  reason: z.string().trim().max(2000).optional().default(""),
});

export type TakedownInput = z.infer<typeof takedownSchema>;

// Shared domains that prove nothing about who owns a company.
const SHARED_DOMAINS = [
  ...Object.values(ATS_APPLY_HOSTS).flat(),
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com", "walla.co.il", "gmx.com",
];

function sourceDomains(source: ExternalSourceRow): string[] {
  const careers = hostOf(source.careers_url);
  return [...source.company_domains, ...(careers ? [careers] : [])].filter(
    (domain) => !hostMatchesAny(domain.toLowerCase(), SHARED_DOMAINS),
  );
}

function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

/** Sources whose recorded domains the requester proved they control. */
async function sourcesOwnedByEmail(db: AdminDb, email: string): Promise<ExternalSourceRow[]> {
  const domain = emailDomain(email);
  if (!domain) return [];
  const { data } = await db.from("external_job_sources").select("*").neq("status", "removed");
  return (data ?? []).filter((s) => hostMatchesAny(domain, sourceDomains(s)));
}

async function sourceOfJob(db: AdminDb, jobId: string): Promise<ExternalSourceRow | null> {
  const { data: job } = await db
    .from("external_jobs")
    .select("source_id")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return null;
  const { data } = await db.from("external_job_sources").select("*").eq("id", job.source_id).maybeSingle();
  return data;
}

/** Best guess for the admin queue only; never used to execute a removal on its own. */
async function sourceByName(db: AdminDb, companyName: string): Promise<ExternalSourceRow | null> {
  const { data } = await db.from("external_job_sources").select("*").neq("status", "removed");
  return (data ?? []).find((s) => normalizeForKey(s.company_name) === normalizeForKey(companyName)) ?? null;
}

export async function createTakedownRequest(
  input: TakedownInput,
): Promise<{ ok: true; verificationSent: boolean } | { ok: false; error: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: "Removal requests are temporarily unavailable. Email support@mingle.careers." };

  const scope = input.jobId ? input.scope : "company";
  // What the request can be verified against depends only on the email
  // domain, never on the company name the requester typed.
  let verifiable: ExternalSourceRow | null = null;
  let fallback: ExternalSourceRow | null = null;
  if (scope === "job") {
    const source = await sourceOfJob(db, input.jobId);
    if (!source) return { ok: false, error: "That listing no longer exists." };
    fallback = source;
    if (hostMatchesAny(emailDomain(input.requesterEmail), sourceDomains(source))) verifiable = source;
  } else {
    verifiable = (await sourcesOwnedByEmail(db, input.requesterEmail))[0] ?? null;
    fallback = verifiable ?? (input.jobId ? await sourceOfJob(db, input.jobId) : await sourceByName(db, input.companyName));
  }

  const token = randomBytes(24).toString("base64url");
  const { data: row, error } = await db
    .from("external_job_takedowns")
    .insert({
      company_name: input.companyName,
      requester_name: input.requesterName || null,
      requester_email: input.requesterEmail,
      job_id: input.jobId || null,
      source_id: verifiable?.id ?? fallback?.id ?? null,
      scope,
      reason: input.reason || null,
      token_hash: sha256(token),
      status: verifiable ? "pending_verification" : "needs_review",
    })
    .select("id")
    .single();
  if (error || !row) return { ok: false, error: "Could not save the request. Please try again." };

  await logEvent(db, {
    kind: "takedown_requested",
    jobId: input.jobId || null,
    sourceId: verifiable?.id ?? null,
    message: `${input.companyName} (${input.requesterEmail}) · ${scope}`,
    actor: input.requesterEmail,
  });

  if (!verifiable) {
    await sendEngineAlert(`Removal request needs review: ${input.companyName}`, [
      `${input.requesterEmail} asked to remove ${scope === "job" ? `job ${input.jobId}` : "all jobs"}.`,
      "The email domain does not match the company's recorded domains, so it was not executed automatically.",
      input.reason ? `Reason: ${input.reason}` : "",
    ]);
    return { ok: true, verificationSent: false };
  }

  // Opens a confirmation page; nothing happens until the button is pressed,
  // so mail scanners that prefetch links can't trigger a removal.
  const link = `${appOrigin()}/job-removal/confirm?id=${row.id}&token=${token}`;
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    await db.from("external_job_takedowns").update({ status: "needs_review" }).eq("id", row.id);
    await sendEngineAlert(`Removal request needs review: ${input.companyName}`, [
      "RESEND_API_KEY is not configured, so no verification email could be sent.",
    ]);
    return { ok: true, verificationSent: false };
  }
  try {
    await new Resend(apiKey).emails.send({
      from: "mingle <noreply@mingle.careers>",
      to: input.requesterEmail,
      subject: "Confirm your job removal request on mingle",
      text: `We received a request to remove ${
        scope === "job" ? "a job listing" : `all job listings for ${input.companyName}`
      } from mingle.\n\nOpen this link and press "Confirm removal" (takes effect immediately):\n${link}\n\nIf you did not make this request, ignore this email.`,
    });
  } catch {
    await db.from("external_job_takedowns").update({ status: "needs_review" }).eq("id", row.id);
    return { ok: true, verificationSent: false };
  }
  return { ok: true, verificationSent: true };
}

/**
 * Removes the job(s) a takedown covers.
 * - "email": the requester confirmed from their inbox; a company-wide request
 *   covers exactly the sources on their email's domain.
 * - "admin": an admin reviewed it; a company-wide request covers the one
 *   source recorded on the request.
 */
export async function executeTakedown(
  db: AdminDb,
  takedownId: string,
  actor: string,
  verifiedBy: "email" | "admin",
): Promise<{ removed: number }> {
  const { data: request } = await db
    .from("external_job_takedowns")
    .select("*")
    .eq("id", takedownId)
    .maybeSingle();
  if (!request) return { removed: 0 };
  const nowIso = new Date().toISOString();
  let removed = 0;

  if (request.scope === "job" && request.job_id) {
    const { data } = await db
      .from("external_jobs")
      .update({ status: "removed", status_reason: `Removed at the company's request (${request.requester_email}).` })
      .eq("id", request.job_id)
      .select("id");
    removed = data?.length ?? 0;
  } else {
    let sources: ExternalSourceRow[] = [];
    if (verifiedBy === "email") {
      sources = await sourcesOwnedByEmail(db, request.requester_email);
    } else if (request.source_id) {
      const { data } = await db.from("external_job_sources").select("*").eq("id", request.source_id);
      sources = data ?? [];
    }
    for (const source of sources) {
      const { data } = await db
        .from("external_jobs")
        .update({ status: "removed", status_reason: `Removed at the company's request (${request.requester_email}).` })
        .eq("source_id", source.id)
        .in("status", ["discovered", "pending_review", "published", "paused"])
        .select("id");
      removed += data?.length ?? 0;
      await db
        .from("external_job_sources")
        .update({
          status: "removed",
          publishing_paused: true,
          publishing_paused_reason: "Company requested removal",
          permission_notes: `${source.permission_notes ? `${source.permission_notes}\n` : ""}${nowIso.slice(0, 10)}: company requested removal of all listings (${request.requester_email}). Do not re-add without written permission.`,
        })
        .eq("id", source.id);
    }
  }

  await db
    .from("external_job_takedowns")
    .update({ status: "completed", resolved_at: nowIso, resolved_by: actor })
    .eq("id", takedownId);
  await logEvent(db, {
    kind: "takedown_completed",
    jobId: request.job_id,
    sourceId: request.source_id,
    message: `${removed} job(s) removed for ${request.company_name}`,
    actor,
  });
  return { removed };
}

async function loadValidRequest(db: AdminDb, id: string, token: string) {
  const { data: request } = await db
    .from("external_job_takedowns")
    .select("id, token_hash, status, requester_email, company_name, scope, job_id")
    .eq("id", id)
    .maybeSingle();
  if (!request || request.token_hash !== sha256(token)) return null;
  return request;
}

/** For the confirmation page: what the link would remove, without doing it. */
export async function previewTakedown(id: string, token: string) {
  const db = createAdminClient();
  if (!db) return null;
  const request = await loadValidRequest(db, id, token);
  if (!request) return null;
  let jobTitle: string | null = null;
  if (request.job_id) {
    const { data } = await db.from("external_jobs").select("title").eq("id", request.job_id).maybeSingle();
    jobTitle = data?.title ?? null;
  }
  const sources = request.scope === "company" ? await sourcesOwnedByEmail(db, request.requester_email) : [];
  return {
    status: request.status,
    scope: request.scope,
    companyName: request.company_name,
    jobTitle,
    sourceNames: sources.map((s) => s.company_name),
  };
}

export async function confirmTakedown(
  id: string,
  token: string,
): Promise<{ ok: boolean; removed: number }> {
  const db = createAdminClient();
  if (!db) return { ok: false, removed: 0 };
  const request = await loadValidRequest(db, id, token);
  if (!request) return { ok: false, removed: 0 };
  if (request.status === "completed") return { ok: true, removed: 0 };
  if (request.status !== "pending_verification") return { ok: false, removed: 0 };

  await db
    .from("external_job_takedowns")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", id);
  const { removed } = await executeTakedown(db, id, request.requester_email, "email");
  return { ok: true, removed };
}
