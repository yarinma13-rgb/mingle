import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { EmptyState } from "@/components/EmptyState";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { UpgradeLock } from "@/components/billing/UpgradeLock";
import { companyHasFeature } from "@/lib/billing/access";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import { loadSavedUserIds } from "@/lib/matching/saved";
import { Avatar } from "@/components/Avatar";
import { ExternalBadge } from "@/components/external-jobs/ExternalBadge";
import { loadSavedExternalJobs } from "@/lib/external-jobs/candidate";

export default async function SavedPage() {
  const { supabase, user, isCompany } = await requireAppUser();

  if (isCompany) {
    const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
    if (!(await companyHasFeature(supabase, companyId, "talent_pool"))) {
      return (
        <>
          <DashboardHeading>Saved</DashboardHeading>
          <UpgradeLock
            title="Talent pool"
            body="Save candidates and come back to them across roles."
            planLabel="Plus"
          />
        </>
      );
    }
  }

  const savedIds = await loadSavedUserIds(supabase, user.id);
  const [display, savedJobs] = await Promise.all([
    loadDisplayInfoForUsers(supabase, savedIds),
    isCompany ? Promise.resolve([]) : loadSavedExternalJobs(supabase, user.id),
  ]);

  return (
    <>
      <DashboardHeading>Saved</DashboardHeading>
      <div className="flex flex-col gap-6">
        <p className="max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          {isCompany
            ? "Candidates you saved to come back to later."
            : "Companies you saved to come back to later."}
        </p>

        {savedIds.length === 0 ? (
          <EmptyState
            title={isCompany ? "No saved candidates yet" : "No saved companies yet"}
            body={
              isCompany
                ? "When someone looks like a fit, save their profile from Discover. They will collect here."
                : "When a company looks like a fit, save their profile from Discover. They will collect here."
            }
            actionHref="/discover"
            actionLabel={isCompany ? "Find candidates" : "Find companies"}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {savedIds.map((id) => {
              const info = display.get(id);
              return (
                <Link
                  key={id}
                  href={`/profile/view/${id}`}
                  prefetch
                  className="flex items-center gap-4 rounded-2xl border border-mingle-border border-l-[3px] border-l-mingle-accent-purple bg-mingle-white p-5 shadow-mingle transition-shadow hover:shadow-mingle"
                >
                  <Avatar
                    photo={info?.photo}
                    initials={info?.initial ?? "?"}
                    gender={info?.gender}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-mingle-text">
                      {info?.name ?? "Saved profile"}
                    </p>
                    {info?.subtitle ? (
                      <p className="mt-0.5 truncate text-xs text-mingle-text-secondary">
                        {info.subtitle}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {savedJobs.length > 0 ? (
          <section className="flex flex-col gap-3">
            <h2 className="font-display text-base font-semibold text-mingle-text">Saved jobs</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {savedJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex flex-col gap-2 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle"
                >
                  <ExternalBadge />
                  <p className="truncate font-display text-sm font-semibold text-mingle-text">{job.title}</p>
                  <p className="truncate text-xs text-mingle-text-secondary">
                    {[job.company_name, job.location, job.work_model].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
