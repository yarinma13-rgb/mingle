import { DEFAULT_GEMINI_MODEL, geminiApiKey, geminiGenerateJson } from "@/lib/ai/gemini";
import { cleanList } from "@/lib/external-jobs/text";
import {
  EMPLOYMENT_TYPES,
  JOB_CATEGORIES,
  WORK_MODELS,
  type ExternalEmploymentType,
  type JobCategory,
  type ProcessedJob,
  type RawJob,
  type WorkModel,
} from "@/lib/external-jobs/types";

/**
 * Models tried in order. Gemini quotas (incl. the free tier's per-day cap,
 * e.g. 20 requests/day for gemini-3.6-flash) are per model, so when one
 * model's daily quota is used up the engine moves on to the next. Override
 * with EXTERNAL_JOBS_GEMINI_MODELS="a,b,c"; every job still passes the same
 * mandatory checks whichever model processed it.
 */
const FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-flash-lite"];

export function modelChain(): string[] {
  const configured = process.env.EXTERNAL_JOBS_GEMINI_MODELS?.split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const primary =
    process.env.EXTERNAL_JOBS_GEMINI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL;
  return [...new Set(configured?.length ? configured : [primary, ...FALLBACK_MODELS])];
}

/**
 * Models whose daily quota ran out, with when to try them again. Quotas reset
 * at midnight Pacific; re-checking hourly costs one failed call at most.
 */
const exhaustedUntil = new Map<string, number>();
const EXHAUSTED_RETRY_MS = 60 * 60_000;

function isExhausted(model: string): boolean {
  const until = exhaustedUntil.get(model);
  if (until == null) return false;
  if (Date.now() < until) return true;
  exhaustedUntil.delete(model);
  return false;
}

function markExhausted(model: string): void {
  exhaustedUntil.set(model, Date.now() + EXHAUSTED_RETRY_MS);
}

/** The model the next call will use, for logs and alerts. */
export function externalJobsModel(): string {
  const chain = modelChain();
  return chain.find((m) => !isExhausted(m)) ?? chain[0];
}

export function aiAvailable(): boolean {
  return geminiApiKey() != null;
}

const MAX_SOURCE_CHARS = 14_000;
/** One slow AI call must not eat the whole run. */
const AI_TIMEOUT_MS = 45_000;
/** Per-minute quota waits (Gemini free tier) are worth honouring within a run. */
const AI_MAX_RETRY_WAIT_MS = 40_000;

/**
 * Client-side pacing for low quotas, per model. EXTERNAL_JOBS_AI_RPM sets it
 * explicitly; otherwise it is learned from the first per-minute quota error
 * ("... limit: 5, ... per minute ..."), so a free-tier key paces itself
 * instead of failing. Unset and never hit = no pacing.
 */
const learnedRpm = new Map<string, number>();
const nextAiSlot = new Map<string, number>();

function pacingRpm(model: string): number | null {
  const configured = Number.parseFloat(process.env.EXTERNAL_JOBS_AI_RPM ?? "");
  if (Number.isFinite(configured) && configured > 0) return configured;
  return learnedRpm.get(model) ?? null;
}

async function aiSlot(model: string): Promise<void> {
  const rpm = pacingRpm(model);
  if (!rpm) return;
  const interval = 60_000 / rpm;
  const now = Date.now();
  const slot = Math.max(now, nextAiSlot.get(model) ?? 0);
  nextAiSlot.set(model, slot + interval);
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
}

/** "...limit: 5, model: ..., description: ... per minute ..." → 5 */
export function perMinuteQuotaLimit(message: string): number | null {
  if (!/per minute/i.test(message)) return null;
  const match = message.match(/limit:\s*(\d+)/i);
  const limit = match ? Number.parseInt(match[1], 10) : Number.NaN;
  return Number.isFinite(limit) && limit > 0 ? limit : null;
}

export function isPerDayQuota(message: string): boolean {
  return /per day/i.test(message) && /quota|limit/i.test(message);
}

/**
 * One AI call, paced per model. A per-minute quota error teaches the limit
 * and retries once in the next slot; a per-day quota error moves on to the
 * next model in the chain. Anything else throws.
 */
async function pacedCall<T>(call: (model: string) => Promise<T>): Promise<{ value: T; model: string }> {
  let lastError: unknown = null;
  for (const model of modelChain()) {
    if (isExhausted(model)) continue;
    await aiSlot(model);
    try {
      return { value: await call(model), model };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      lastError = error;
      if (isPerDayQuota(message)) {
        markExhausted(model);
        continue;
      }
      const limit = perMinuteQuotaLimit(message);
      if (!limit) throw error;
      // Stay a little under the limit: other calls may share the project quota.
      const rpm = Math.max(1, limit - 0.5);
      learnedRpm.set(model, rpm);
      nextAiSlot.set(model, Math.max(nextAiSlot.get(model) ?? 0, Date.now() + 60_000 / rpm));
      await aiSlot(model);
      try {
        return { value: await call(model), model };
      } catch (retryError) {
        lastError = retryError;
        const retryMessage = retryError instanceof Error ? retryError.message : "";
        if (!isPerDayQuota(retryMessage)) throw retryError;
        markExhausted(model);
      }
    }
  }
  throw lastError ?? new Error("All AI models are out of quota for today.");
}

function sourceBlock(job: RawJob): string {
  return [
    `Company: ${job.companyName}`,
    `Title: ${job.title}`,
    `Location: ${job.location ?? "(not stated)"}`,
    `Department: ${job.department ?? "(not stated)"}`,
    `Work model hint: ${job.workModelHint ?? "(not stated)"}`,
    `Employment type hint: ${job.employmentTypeHint ?? "(not stated)"}`,
    "",
    "Job text:",
    job.text.slice(0, MAX_SOURCE_CHARS),
  ].join("\n");
}

const REWRITE_SYSTEM = `You prepare job listings for mingle, a career platform, from a company's official job posting.

Return ONLY JSON with exactly these keys:
{
  "location": string | null,
  "workModel": ${WORK_MODELS.map((m) => `"${m}"`).join(" | ")} | null,
  "employmentType": ${EMPLOYMENT_TYPES.map((m) => `"${m}"`).join(" | ")} | null,
  "seniority": string | null,
  "department": string | null,
  "category": one of ${JSON.stringify(JOB_CATEGORIES)},
  "sourceLanguage": ISO 639-1 code of the source text, e.g. "en" or "he",
  "summary": string,
  "responsibilities": string[],
  "requirements": string[],
  "niceToHave": string[],
  "tags": string[]
}

Rules — these are strict:
1. Use ONLY facts stated in the source. Never invent or infer requirements, years of experience, salary, compensation, equity, benefits, perks, visa sponsorship, team size, or anything else the source does not say. If a field is not stated, use null or an empty list.
2. Write everything in your own words. Do NOT copy sentences or long phrases from the source. Skill and technology names (e.g. "React", "Kubernetes") may be kept as-is.
3. Keep the original meaning, requirements and qualifications. Do not drop a hard requirement and do not turn a nice-to-have into a requirement or vice versa.
4. "summary": 2–4 sentences describing the role itself (not company marketing).
5. "responsibilities", "requirements", "niceToHave": short bullet phrases, max 10 each.
6. "tags": 3–10 short professional search tags (skills, technologies, domain) that are explicitly supported by the source.
7. Write in the source language if it is English or Hebrew; otherwise write in English.
8. Never say or imply the company partners with, endorses, or hires through mingle. Never mention applying on mingle.`;

const FACT_CHECK_SYSTEM = `You are a strict fact-checker comparing a rewritten job listing with the original job posting it was produced from.

Return ONLY JSON:
{
  "unsupportedClaims": string[],      // statements in the rewrite that the source does not support (invented requirements, salary, benefits, conditions, details)
  "missingKeyRequirements": string[], // hard requirements in the source that the rewrite dropped or materially changed
  "misleading": string[]              // anything that misrepresents the role, the employer, or implies a partnership with mingle
}

Be precise. Paraphrase is fine. Translation is fine. Only list real problems; return empty lists when there are none.`;

type RewriteOutput = {
  location?: unknown;
  workModel?: unknown;
  employmentType?: unknown;
  seniority?: unknown;
  department?: unknown;
  category?: unknown;
  sourceLanguage?: unknown;
  summary?: unknown;
  responsibilities?: unknown;
  requirements?: unknown;
  niceToHave?: unknown;
  tags?: unknown;
};

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function text(value: unknown, max = 200): string | null {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

export async function rewriteJob(job: RawJob): Promise<ProcessedJob> {
  const { value: out, model } = await pacedCall((model) => geminiGenerateJson<RewriteOutput>({
    system: REWRITE_SYSTEM,
    user: sourceBlock(job),
    model,
    timeoutMs: AI_TIMEOUT_MS,
    maxRetryWaitMs: AI_MAX_RETRY_WAIT_MS,
  }));

  return {
    model,
    // Company and title always come from the source verbatim: they are facts,
    // not prose, and must match the official posting exactly.
    companyName: job.companyName,
    title: job.title,
    location: job.location ?? text(out.location),
    workModel: job.workModelHint ?? oneOf<WorkModel>(out.workModel, WORK_MODELS),
    employmentType:
      job.employmentTypeHint ?? oneOf<ExternalEmploymentType>(out.employmentType, EMPLOYMENT_TYPES),
    seniority: text(out.seniority, 60),
    department: job.department ?? text(out.department, 80),
    category: oneOf<JobCategory>(out.category, JOB_CATEGORIES) ?? "Other",
    sourceLanguage: text(out.sourceLanguage, 8)?.toLowerCase() ?? "und",
    summary: text(out.summary, 1200) ?? "",
    responsibilities: cleanList(out.responsibilities, 10),
    requirements: cleanList(out.requirements, 10),
    niceToHave: cleanList(out.niceToHave, 10),
    tags: cleanList(out.tags, 10).map((tag) => tag.slice(0, 40)),
  };
}

export type FactCheck = {
  unsupportedClaims: string[];
  missingKeyRequirements: string[];
  misleading: string[];
};

export async function factCheckJob(job: RawJob, processed: ProcessedJob): Promise<FactCheck> {
  const rewrite = [
    `Title: ${processed.title}`,
    `Location: ${processed.location ?? "-"}`,
    `Work model: ${processed.workModel ?? "-"}`,
    `Employment type: ${processed.employmentType ?? "-"}`,
    `Seniority: ${processed.seniority ?? "-"}`,
    `Summary: ${processed.summary}`,
    `Responsibilities:\n- ${processed.responsibilities.join("\n- ")}`,
    `Requirements:\n- ${processed.requirements.join("\n- ")}`,
    `Nice to have:\n- ${processed.niceToHave.join("\n- ")}`,
    `Tags: ${processed.tags.join(", ")}`,
  ].join("\n");

  const { value: out } = await pacedCall((model) => geminiGenerateJson<Partial<Record<keyof FactCheck, unknown>>>({
    system: FACT_CHECK_SYSTEM,
    user: `ORIGINAL POSTING:\n${sourceBlock(job)}\n\nREWRITE:\n${rewrite}`,
    model,
    timeoutMs: AI_TIMEOUT_MS,
    maxRetryWaitMs: AI_MAX_RETRY_WAIT_MS,
  }));
  return {
    unsupportedClaims: cleanList(out.unsupportedClaims, 20),
    missingKeyRequirements: cleanList(out.missingKeyRequirements, 20),
    misleading: cleanList(out.misleading, 20),
  };
}
