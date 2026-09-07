import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import { loadSavedUserIds } from "@/lib/matching/saved";
import { Avatar } from "@/components/Avatar";

export default async function SavedPage() {
  const { supabase, user, userRow, isCompany, shellAvatar } =
    await requireShellUser();

  const savedIds = await loadSavedUserIds(supabase, user.id);
  const display = await loadDisplayInfoForUsers(supabase, savedIds);

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Saved"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
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
                  className="flex items-center gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle transition-shadow hover:shadow-mingle"
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
      </div>
    </DashboardShell>
  );
}
