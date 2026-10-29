import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalBadge } from "@/components/external-jobs/ExternalBadge";
import { SaveJobButton } from "@/components/external-jobs/SaveJobButton";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import {
  EMPLOYMENT_LABELS,
  loadPublishedExternalJob,
  loadSavedExternalJobIds,
  loadTalentSignals,
} from "@/lib/external-jobs/candidate";
import { recordEngagement } from "@/lib/external-jobs/engagement";
import { recommendJob, RECOMMENDED_THRESHOLD } from "@/lib/external-jobs/recommend";
import { EXTERNAL_JOB_DISCLAIMER } from "@/lib/external-jobs/types";

export const metadata: Metadata = {
  // Third-party listings: keep them out of search indexes.
  robots: { index: false, follow: false },
};

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-display text-base font-semibold text-mingle-text">{title}</h2>
      <ul className="list-disc space-y-1 ps-5 text-sm leading-relaxed text-mingle-text">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function ExternalJobPage({ params }: PageProps<"/jobs/[id]">) {
  const { id } = await params;
  const { supabase, user, isCompany } = await requireAppUser();
  if (isCompany) redirect("/roles");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const job = await loadPublishedExternalJob(supabase, id);
  if (!job) redirect("/jobs?closed=1");

  const [signals, saved] = await Promise.all([
    loadTalentSignals(supabase, user.id),
    loadSavedExternalJobIds(supabase, user.id),
    recordEngagement(job.id, "view", user.id),
  ]);
  const rec = recommendJob(signals, {
    title: job.title,
    tags: job.tags,
    location: job.location,
    workModel: job.work_model,
  });
  const lastUpdated = job.last_verified_at ?? job.updated_at;
  const rtl = job.source_language === "he";

  return (
    <article className="flex max-w-3xl flex-col gap-6">
      <Link href="/jobs" className="text-sm text-mingle-text-secondary underline-offset-2 hover:underline">
        ← All jobs
      </Link>

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ExternalBadge />
          {job.category ? (
            <span className="rounded-full bg-mingle-lavender px-2 py-0.5 text-[11px] text-mingle-text">{job.category}</span>
          ) : null}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-mingle-text sm:text-3xl" dir="auto">
          {job.title}
        </h1>
        <p className="text-sm text-mingle-text-secondary">
          {[
            job.company_name,
            job.location,
            job.work_model,
            job.employment_type ? EMPLOYMENT_LABELS[job.employment_type] : null,
            job.seniority,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/external-jobs/${job.id}/apply`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mingle-btn-primary text-sm"
          >
            Apply on {job.company_name}’s site
          </a>
          <SaveJobButton jobId={job.id} saved={saved.has(job.id)} />
        </div>
        <p className="rounded-xl border border-mingle-border bg-mingle-bg px-4 py-3 text-xs leading-relaxed text-mingle-text-secondary">
          {EXTERNAL_JOB_DISCLAIMER}
        </p>
      </header>

      {rec.score >= RECOMMENDED_THRESHOLD ? (
        <section className="rounded-2xl border border-mingle-border bg-mingle-white p-4">
          <p className="text-sm font-semibold text-mingle-text">{rec.score}% match with your profile</p>
          <p className="mt-1 text-xs text-mingle-text-secondary">{rec.reasons.join(" · ")}</p>
        </section>
      ) : null}

      <div className="flex flex-col gap-6" dir={rtl ? "rtl" : "auto"}>
        {job.summary ? (
          <section className="flex flex-col gap-2">
            <h2 className="font-display text-base font-semibold text-mingle-text">About the role</h2>
            <p className="text-sm leading-relaxed text-mingle-text">{job.summary}</p>
          </section>
        ) : null}
        <Section title="What you’ll do" items={job.responsibilities} />
        <Section title="Requirements" items={job.requirements} />
        <Section title="Nice to have" items={job.nice_to_have} />
      </div>

      {job.tags.length ? (
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-mingle-lavender px-2 py-0.5 text-xs text-mingle-text">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <footer className="flex flex-col gap-1 border-t border-mingle-border pt-4 text-xs text-mingle-text-secondary">
        <p>
          Last updated {new Date(lastUpdated).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}.
          {" "}Description written by mingle from the company’s official posting; the company’s site is the source of truth.
        </p>
        <p>
          {job.company_name} is not affiliated with mingle. Applications and hiring decisions happen entirely on the company’s site.
        </p>
        <p>
          Represent {job.company_name}?{" "}
          <Link href={`/job-removal?jobId=${job.id}`} className="underline underline-offset-2">
            Request removal
          </Link>
        </p>
      </footer>
    </article>
  );
}
