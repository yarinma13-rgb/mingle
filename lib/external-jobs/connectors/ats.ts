import {
  htmlToText,
  inferEmploymentType,
  inferWorkModel,
  isoOrNull,
  joinLocation,
  MAX_JOBS_PER_SOURCE,
  type Connector,
} from "@/lib/external-jobs/connectors/common";
import { SourceTransientError } from "@/lib/external-jobs/http";
import type { RawJob } from "@/lib/external-jobs/types";

/*
 * Connectors for applicant-tracking systems that publish an official,
 * unauthenticated job-board API intended for embedding a company's open jobs
 * on other sites. Each reads only what the company chose to publish.
 */

function requireOk(status: number, data: unknown, label: string) {
  if (status === 404) {
    throw new SourceTransientError(`${label}: board not found (404). Check the source key.`);
  }
  if (status >= 400 || data == null) {
    throw new SourceTransientError(`${label}: unexpected response (${status}).`);
  }
}

// --- Greenhouse: https://developers.greenhouse.io/job-board.html ----------
type GreenhouseJob = {
  id: number;
  title: string;
  updated_at?: string;
  first_published?: string;
  absolute_url: string;
  content?: string;
  location?: { name?: string };
  departments?: Array<{ name?: string }>;
};

export const greenhouse: Connector = {
  endpoint: (source) =>
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.source_key)}/jobs?content=true`,
  async list(source, fetcher) {
    const { status, data } = await fetcher.getJson<{ jobs?: GreenhouseJob[] }>(
      this.endpoint(source),
    );
    requireOk(status, data, "Greenhouse");
    const all = data?.jobs ?? [];
    const jobs: RawJob[] = all.slice(0, MAX_JOBS_PER_SOURCE).map((job) => {
      const text = htmlToText(job.content);
      return {
        externalId: String(job.id),
        title: job.title.trim(),
        companyName: source.company_name,
        location: job.location?.name?.trim() || null,
        workModelHint: inferWorkModel(job.location?.name, text.slice(0, 600)),
        employmentTypeHint: inferEmploymentType(text.slice(0, 600)),
        department: job.departments?.[0]?.name?.trim() || null,
        text,
        applyUrl: job.absolute_url,
        sourceUrl: job.absolute_url,
        postedAt: isoOrNull(job.first_published),
        updatedAt: isoOrNull(job.updated_at),
        payload: { id: job.id, location: job.location, departments: job.departments },
      };
    });
    return { jobs, complete: all.length <= MAX_JOBS_PER_SOURCE };
  },
};

// --- Lever: https://github.com/lever/postings-api --------------------------
type LeverPosting = {
  id: string;
  text: string;
  hostedUrl: string;
  applyUrl?: string;
  createdAt?: number;
  workplaceType?: string;
  descriptionPlain?: string;
  additionalPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
  categories?: { location?: string; commitment?: string; team?: string; department?: string };
};

export const lever: Connector = {
  endpoint: (source) =>
    `https://api.lever.co/v0/postings/${encodeURIComponent(source.source_key)}?mode=json`,
  async list(source, fetcher) {
    const { status, data } = await fetcher.getJson<LeverPosting[]>(this.endpoint(source));
    requireOk(status, data, "Lever");
    const all = Array.isArray(data) ? data : [];
    const jobs: RawJob[] = all.slice(0, MAX_JOBS_PER_SOURCE).map((posting) => {
      const lists = (posting.lists ?? [])
        .map((list) => `${list.text ?? ""}\n${htmlToText(list.content)}`)
        .join("\n\n");
      const text = [posting.descriptionPlain, lists, posting.additionalPlain]
        .filter(Boolean)
        .join("\n\n")
        .trim();
      return {
        externalId: posting.id,
        title: posting.text.trim(),
        companyName: source.company_name,
        location: posting.categories?.location?.trim() || null,
        workModelHint: inferWorkModel(posting.workplaceType, posting.categories?.location),
        employmentTypeHint: inferEmploymentType(posting.categories?.commitment),
        department: posting.categories?.department || posting.categories?.team || null,
        text,
        applyUrl: posting.applyUrl || posting.hostedUrl,
        sourceUrl: posting.hostedUrl,
        postedAt: isoOrNull(posting.createdAt),
        updatedAt: null,
        payload: { id: posting.id, categories: posting.categories, workplaceType: posting.workplaceType },
      };
    });
    return { jobs, complete: all.length <= MAX_JOBS_PER_SOURCE };
  },
};

// --- Ashby: https://developers.ashbyhq.com/docs/public-job-posting-api ----
type AshbyJob = {
  id: string;
  title: string;
  location?: string;
  department?: string;
  team?: string;
  isRemote?: boolean;
  isListed?: boolean;
  workplaceType?: string;
  employmentType?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  publishedAt?: string;
  jobUrl: string;
  applyUrl?: string;
};

export const ashby: Connector = {
  endpoint: (source) =>
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.source_key)}`,
  async list(source, fetcher) {
    const { status, data } = await fetcher.getJson<{ jobs?: AshbyJob[] }>(this.endpoint(source));
    requireOk(status, data, "Ashby");
    const all = (data?.jobs ?? []).filter((job) => job.isListed !== false);
    const jobs: RawJob[] = all.slice(0, MAX_JOBS_PER_SOURCE).map((job) => ({
      externalId: job.id,
      title: job.title.trim(),
      companyName: source.company_name,
      location: job.location?.trim() || null,
      workModelHint: inferWorkModel(job.workplaceType, job.isRemote),
      employmentTypeHint: inferEmploymentType(job.employmentType),
      department: job.department || job.team || null,
      text: job.descriptionPlain?.trim() || htmlToText(job.descriptionHtml),
      applyUrl: job.applyUrl || job.jobUrl,
      sourceUrl: job.jobUrl,
      postedAt: isoOrNull(job.publishedAt),
      updatedAt: null,
      payload: { id: job.id, workplaceType: job.workplaceType, employmentType: job.employmentType },
    }));
    return { jobs, complete: all.length <= MAX_JOBS_PER_SOURCE };
  },
};

// --- Workable: public account widget API -----------------------------------
type WorkableJob = {
  title: string;
  shortcode: string;
  employment_type?: string;
  telecommuting?: boolean;
  department?: string;
  url?: string;
  shortlink?: string;
  application_url?: string;
  published_on?: string;
  created_at?: string;
  city?: string;
  state?: string;
  country?: string;
  description?: string;
};

export const workable: Connector = {
  endpoint: (source) =>
    `https://apply.workable.com/api/v1/widget/accounts/${encodeURIComponent(source.source_key)}?details=true`,
  async list(source, fetcher) {
    const { status, data } = await fetcher.getJson<{ jobs?: WorkableJob[] }>(this.endpoint(source));
    requireOk(status, data, "Workable");
    const all = data?.jobs ?? [];
    const jobs: RawJob[] = all.slice(0, MAX_JOBS_PER_SOURCE).map((job) => {
      const url = job.url || job.shortlink || `https://apply.workable.com/${source.source_key}/j/${job.shortcode}/`;
      return {
        externalId: job.shortcode,
        title: job.title.trim(),
        companyName: source.company_name,
        location: joinLocation(job.city, job.state, job.country),
        workModelHint: inferWorkModel(job.telecommuting),
        employmentTypeHint: inferEmploymentType(job.employment_type),
        department: job.department || null,
        text: htmlToText(job.description),
        applyUrl: job.application_url || url,
        sourceUrl: url,
        postedAt: isoOrNull(job.published_on || job.created_at),
        updatedAt: null,
        payload: { shortcode: job.shortcode, employment_type: job.employment_type },
      };
    });
    return { jobs, complete: all.length <= MAX_JOBS_PER_SOURCE };
  },
};

// --- SmartRecruiters: https://developers.smartrecruiters.com/docs/posting-api
type SrListItem = {
  id: string;
  name: string;
  releasedDate?: string;
  location?: { city?: string; region?: string; country?: string; remote?: boolean; hybrid?: boolean };
  typeOfEmployment?: { label?: string };
  department?: { label?: string };
};
type SrDetail = SrListItem & {
  applyUrl?: string;
  postingUrl?: string;
  jobAd?: {
    sections?: Record<string, { title?: string; text?: string } | undefined>;
  };
};

export const smartrecruiters: Connector = {
  endpoint: (source) =>
    `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(source.source_key)}/postings?limit=100`,
  async list(source, fetcher) {
    const { status, data } = await fetcher.getJson<{ content?: SrListItem[]; totalFound?: number }>(
      this.endpoint(source),
    );
    requireOk(status, data, "SmartRecruiters");
    const items = (data?.content ?? []).slice(0, MAX_JOBS_PER_SOURCE);
    const jobs: RawJob[] = [];
    for (const item of items) {
      const detailUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(source.source_key)}/postings/${encodeURIComponent(item.id)}`;
      const detail = await fetcher.getJson<SrDetail>(detailUrl);
      if (!detail.data) continue;
      const sections = detail.data.jobAd?.sections ?? {};
      // companyDescription is deliberately skipped: it describes the employer,
      // not the role, and is the most likely part to be marketing copy.
      const text = ["jobDescription", "qualifications", "additionalInformation"]
        .map((key) => {
          const section = sections[key];
          return section?.text ? `${section.title ?? ""}\n${htmlToText(section.text)}` : "";
        })
        .filter(Boolean)
        .join("\n\n");
      const postingUrl =
        detail.data.postingUrl || `https://jobs.smartrecruiters.com/${source.source_key}/${item.id}`;
      jobs.push({
        externalId: item.id,
        title: item.name.trim(),
        companyName: source.company_name,
        location: joinLocation(item.location?.city, item.location?.region, item.location?.country),
        workModelHint: item.location?.hybrid
          ? "Hybrid"
          : item.location?.remote
            ? "Remote"
            : null,
        employmentTypeHint: inferEmploymentType(item.typeOfEmployment?.label),
        department: item.department?.label || null,
        text,
        applyUrl: detail.data.applyUrl || postingUrl,
        sourceUrl: postingUrl,
        postedAt: isoOrNull(item.releasedDate),
        updatedAt: null,
        payload: { id: item.id, location: item.location },
      });
    }
    const total = data?.totalFound ?? items.length;
    return { jobs, complete: total <= items.length && jobs.length === items.length };
  },
};
