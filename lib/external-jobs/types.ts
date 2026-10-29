import type { Database, ExternalSourceType } from "@/lib/supabase/types";

export type ExternalSourceRow =
  Database["public"]["Tables"]["external_job_sources"]["Row"];
export type ExternalJobRow = Database["public"]["Tables"]["external_jobs"]["Row"];

/** Shown on every external job page and card detail (spec §3). */
export const EXTERNAL_JOB_DISCLAIMER =
  "This job is sourced from the company’s official careers website. Applications are submitted directly through the company’s website.";

export const EXTERNAL_OPPORTUNITY_LABEL = "External Opportunity";

/** Identifies the crawler to every source; points at the takedown page. */
export const CRAWLER_USER_AGENT =
  "MingleJobsBot/1.0 (+https://mingle.careers/job-removal)";
export const CRAWLER_ROBOTS_TOKEN = "minglejobsbot";

export const JOB_CATEGORIES = [
  "Engineering",
  "Data & AI",
  "Product",
  "Design",
  "DevOps & IT",
  "Security",
  "QA",
  "Marketing",
  "Sales",
  "Customer Success",
  "Operations",
  "Finance",
  "HR & Recruiting",
  "Legal",
  "Other",
] as const;
export type JobCategory = (typeof JOB_CATEGORIES)[number];

export const WORK_MODELS = ["Remote", "Hybrid", "Office based"] as const;
export type WorkModel = (typeof WORK_MODELS)[number];

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
  "temporary",
] as const;
export type ExternalEmploymentType = (typeof EMPLOYMENT_TYPES)[number];

/**
 * Methods that can't be used right now and are hidden from "Add source".
 * SmartRecruiters' robots.txt (checked 2026-10-28) disallows its API for
 * every crawler except LinkedInBot, so the engine would always refuse it.
 */
export const UNAVAILABLE_SOURCE_TYPES: ExternalSourceType[] = ["smartrecruiters"];

export const SOURCE_TYPE_LABELS: Record<ExternalSourceType, string> = {
  greenhouse: "Greenhouse Job Board API",
  lever: "Lever Postings API",
  ashby: "Ashby Job Posting API",
  workable: "Workable public widget API",
  smartrecruiters: "SmartRecruiters Posting API",
  jsonld_sitemap: "Careers sitemap + schema.org JobPosting",
};

/**
 * One job as a connector returned it, before any AI processing. Fields are
 * the source's own wording; `text` is the plain-text body we validate the
 * rewrite against.
 */
export type RawJob = {
  externalId: string;
  title: string;
  companyName: string;
  location: string | null;
  workModelHint: WorkModel | null;
  employmentTypeHint: ExternalEmploymentType | null;
  department: string | null;
  text: string;
  applyUrl: string;
  sourceUrl: string;
  postedAt: string | null;
  updatedAt: string | null;
  payload: unknown;
};

/** AI output, after schema coercion. */
export type ProcessedJob = {
  /** Gemini model that wrote this version (set by rewriteJob). */
  model?: string;
  companyName: string;
  title: string;
  location: string | null;
  workModel: WorkModel | null;
  employmentType: ExternalEmploymentType | null;
  seniority: string | null;
  department: string | null;
  category: JobCategory;
  sourceLanguage: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  tags: string[];
};
