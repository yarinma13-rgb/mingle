import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { EmptyState } from "@/components/EmptyState";
import { ExternalBadge, OnMingleBadge } from "@/components/external-jobs/ExternalBadge";
import { SaveJobButton } from "@/components/external-jobs/SaveJobButton";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import {
  EMPLOYMENT_LABELS,
  loadJobsFeed,
  type JobsFilters,
} from "@/lib/external-jobs/candidate";
import { RECOMMENDED_THRESHOLD } from "@/lib/external-jobs/recommend";
import { WORK_MODELS } from "@/lib/external-jobs/types";

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value ?? "").trim().slice(0, 100);
}

const selectClass =
  "rounded-xl border border-mingle-border bg-mingle-white px-3 py-2 text-sm text-mingle-text";

export default async function JobsPage({ searchParams }: PageProps<"/jobs">) {
  const query = await searchParams;
  const { supabase, user, isCompany } = await requireAppUser();
  if (isCompany) redirect("/roles");

  const origin = one(query.origin);
  const filters: JobsFilters = {
    q: one(query.q),
    workModel: one(query.workModel),
    category: one(query.category),
    employmentType: one(query.employmentType),
    location: one(query.location),
    origin: origin === "mingle" || origin === "external" ? origin : "",
    sort: one(query.sort) === "newest" ? "newest" : "recommended",
  };
  const { cards, categories } = await loadJobsFeed(supabase, user.id, filters);
  const hasFilters = Boolean(
    filters.q || filters.workModel || filters.category || filters.employmentType || filters.location || filters.origin,
  );

  return (
    <>
      <DashboardHeading>Jobs</DashboardHeading>
      <div className="flex flex-col gap-6">
        {one(query.closed) ? (
          <p className="rounded-xl border border-mingle-border bg-mingle-lavender/60 px-4 py-3 text-sm text-mingle-text">
            That job is no longer available. Here are other open roles.
          </p>
        ) : null}

        <form className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-4" role="search">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Search by title, company or skill"
            aria-label="Search jobs"
            className="w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2.5 text-base sm:text-sm"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <input
              name="location"
              defaultValue={filters.location}
              placeholder="Location"
              aria-label="Location"
              className={selectClass}
            />
            <select name="workModel" defaultValue={filters.workModel} aria-label="Work model" className={selectClass}>
              <option value="">Any work model</option>
              {WORK_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select name="employmentType" defaultValue={filters.employmentType} aria-label="Job type" className={selectClass}>
              <option value="">Any job type</option>
              {Object.entries(EMPLOYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select name="category" defaultValue={filters.category} aria-label="Category" className={selectClass}>
              <option value="">Any category</option>
              {[...new Set([...categories, filters.category].filter(Boolean))].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="origin" defaultValue={filters.origin} aria-label="Source" className={selectClass}>
              <option value="">All jobs</option>
              <option value="mingle">Hiring on mingle</option>
              <option value="external">External opportunities</option>
            </select>
            <select name="sort" defaultValue={filters.sort} aria-label="Sort" className={selectClass}>
              <option value="recommended">Best match</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="mingle-btn-primary text-sm">Search</button>
            {hasFilters ? (
              <Link href="/jobs" className="text-sm text-mingle-text-secondary underline-offset-2 hover:underline">
                Clear
              </Link>
            ) : null}
            <span className="ml-auto text-xs text-mingle-text-secondary">
              {cards.length} job{cards.length === 1 ? "" : "s"}
            </span>
          </div>
        </form>

        {cards.length === 0 ? (
          <EmptyState
            variant="search"
            title={hasFilters ? "No jobs match these filters" : "No open jobs yet"}
            body={
              hasFilters
                ? "Try a broader search or clear a filter."
                : "New roles are added every day. Check back soon."
            }
            actionHref={hasFilters ? "/jobs" : "/discover"}
            actionLabel={hasFilters ? "Clear filters" : "Discover companies"}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cards.map((card) => {
              const recommended = card.score >= RECOMMENDED_THRESHOLD;
              return (
                <li
                  key={card.key}
                  className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {card.origin === "external" ? <ExternalBadge /> : <OnMingleBadge />}
                    {recommended ? (
                      <span className="rounded-full bg-mingle-accent-pink/12 px-2 py-0.5 text-[11px] font-semibold text-mingle-pink-deep">
                        {card.score}% match
                      </span>
                    ) : null}
                  </div>
                  <Link href={card.href} className="group min-w-0">
                    <p className="font-display text-base font-semibold text-mingle-text group-hover:underline">
                      {card.title}
                    </p>
                    <p className="mt-0.5 text-sm text-mingle-text-secondary">
                      {[card.companyName, card.location, card.workModel, card.employmentType ? EMPLOYMENT_LABELS[card.employmentType] : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </Link>
                  {recommended && card.reasons.length ? (
                    <p className="text-xs text-mingle-text-secondary">{card.reasons.join(" · ")}</p>
                  ) : null}
                  {card.tags.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {card.tags.slice(0, 6).map((tag) => (
                        <span key={tag} className="rounded-full bg-mingle-lavender px-2 py-0.5 text-[11px] text-mingle-text">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <Link href={card.href} className="mingle-btn-secondary text-xs">
                      View details
                    </Link>
                    {card.origin === "external" ? (
                      <>
                        <a
                          href={`/api/external-jobs/${card.id}/apply`}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mingle-btn-primary text-xs"
                        >
                          Apply on company site
                        </a>
                        <span className="ml-auto">
                          <SaveJobButton jobId={card.id} saved={card.saved} />
                        </span>
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
