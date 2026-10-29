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

export function externalJobsModel(): string {
  return (
    process.env.EXTERNAL_JOBS_GEMINI_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    DEFAULT_GEMINI_MODEL
  );
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
 * Optional client-side pacing for low quotas: EXTERNAL_JOBS_AI_RPM=5 spaces
 * calls 12s apart (Gemini free tier). Unset = no pacing.
 */
let nextAiSlot = 0;
async function aiSlot(): Promise<void> {
  const rpm = Number.parseFloat(process.env.EXTERNAL_JOBS_AI_RPM ?? "");
  if (!Number.isFinite(rpm) || rpm <= 0) return;
  const interval = 60_000 / rpm;
  const now = Date.now();
  const slot = Math.max(now, nextAiSlot);
  nextAiSlot = slot + interval;
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
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
  await aiSlot();
  const out = await geminiGenerateJson<RewriteOutput>({
    system: REWRITE_SYSTEM,
    user: sourceBlock(job),
    model: externalJobsModel(),
    timeoutMs: AI_TIMEOUT_MS,
    maxRetryWaitMs: AI_MAX_RETRY_WAIT_MS,
  });

  return {
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

  await aiSlot();
  const out = await geminiGenerateJson<Partial<Record<keyof FactCheck, unknown>>>({
    system: FACT_CHECK_SYSTEM,
    user: `ORIGINAL POSTING:\n${sourceBlock(job)}\n\nREWRITE:\n${rewrite}`,
    model: externalJobsModel(),
    timeoutMs: AI_TIMEOUT_MS,
    maxRetryWaitMs: AI_MAX_RETRY_WAIT_MS,
  });
  return {
    unsupportedClaims: cleanList(out.unsupportedClaims, 20),
    missingKeyRequirements: cleanList(out.missingKeyRequirements, 20),
    misleading: cleanList(out.misleading, 20),
  };
}
