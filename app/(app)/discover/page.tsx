import Link from "next/link";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { DiscoverGrowthTracker } from "@/components/discovery/DiscoverGrowthTracker";
import { DiscoveryScreen } from "@/components/discovery/DiscoveryScreen";
import {
  DiscoveryFiltersForm,
  DiscoveryPagination,
} from "@/components/discovery/DiscoveryFilters";
import {
  discoveryFiltersActive,
  discoveryQueryString,
  parseDiscoveryFilters,
} from "@/lib/discovery/filters";
import { loadDiscoveryPage } from "@/lib/discovery/query";
import { loadSavedUserIds } from "@/lib/matching/saved";
import { loadPassedUserIds } from "@/lib/matching/passed";
import { loadMatchFeedbackMap } from "@/lib/matching/feedback";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { PROFILE_QUESTIONS } from "@/lib/profile/questions";
import { COMPANY_QUESTIONS } from "@/lib/company-profile/questions";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function DiscoverPage({
  searchParams,
}: PageProps<"/discover">) {
  const { supabase, user, userRow } = await requireAppUser();
  const params = await searchParams;
  const viewRaw = Array.isArray(params.view) ? params.view[0] : params.view;
  const viewPassed = viewRaw === "passed";
  const viewBrowse = viewRaw === "browse" && userRow.user_type === "company";
  const filters = parseDiscoveryFilters(params);
  const styleOptions =
    userRow.user_type === "company"
      ? (PROFILE_QUESTIONS.find((question) => question.key === "workStyle")
          ?.options ?? [])
      : (COMPANY_QUESTIONS.find((question) => question.key === "workEnvironment")
          ?.options ?? []);
  const valueOptions =
    PROFILE_QUESTIONS.find((question) => question.key === "drives")?.options ??
    [];

  const [savedUserIds, passedUserIds, feedbackByUser, acceptedConnections] =
    await Promise.all([
      loadSavedUserIds(supabase, user.id),
      loadPassedUserIds(supabase, user.id),
      loadMatchFeedbackMap(supabase, user.id),
      loadAcceptedConnections(supabase, user.id),
    ]);
  const acceptedConnectionByUser: Record<string, string> = {};
  for (const row of acceptedConnections) {
    const otherId =
      row.requester_id === user.id ? row.recipient_id : row.requester_id;
    acceptedConnectionByUser[otherId] = row.id;
  }
  const { cards, total, pageSize } = await loadDiscoveryPage(
    supabase,
    { id: user.id, userType: userRow.user_type },
    filters,
    styleOptions,
    viewPassed
      ? { onlyUserIds: passedUserIds }
      : { excludeUserIds: passedUserIds },
  );

  const filtersActive = discoveryFiltersActive(filters);
  const screenKey = [
    filters.industry,
    filters.location,
    filters.style,
    filters.role,
    filters.workModel,
    filters.yearsMin,
    filters.yearsMax,
    filters.values.join(","),
    filters.page,
  ].join("|");

  const mode = viewPassed ? "passed" : viewBrowse ? "browse" : "feed";
  const title = viewPassed
    ? "Passed"
    : viewBrowse
      ? "Browse all candidates"
      : userRow.user_type === "company"
        ? "People worth getting to know"
        : "Companies worth getting to know";
  const subtitle = viewPassed
    ? "Everyone you skipped. View again puts them back in Discover."
    : viewBrowse
      ? "Scan everyone on this page, open any profile or CV, then page through the rest."
      : userRow.user_type === "company"
        ? "Every candidate here, scored honestly against your company profile — including where you don't overlap yet."
        : "Every company here, scored honestly against your profile — including where you don't overlap yet.";

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-2 font-display text-xs font-semibold ${
      active
        ? "bg-mingle-lavender text-mingle-text"
        : "text-mingle-text-secondary hover:text-mingle-text"
    }`;

  return (
    <>
      <DiscoverGrowthTracker userType={userRow.user_type} />
      <DashboardHeading>Discover</DashboardHeading>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={discoveryQueryString(filters, 1)}
            prefetch
            className={tabClass(!viewPassed && !viewBrowse)}
          >
            Discover
          </Link>
          {userRow.user_type === "company" ? (
            <Link
              href={discoveryQueryString(filters, filters.page, "browse")}
              prefetch
              className={tabClass(viewBrowse)}
            >
              Browse all
            </Link>
          ) : null}
          <Link
            href="/discover?view=passed"
            prefetch
            className={tabClass(viewPassed)}
          >
            Passed{passedUserIds.length ? ` · ${passedUserIds.length}` : ""}
          </Link>
        </div>
        {viewPassed ? null : (
          <DiscoveryFiltersForm
            filters={filters}
            styleOptions={styleOptions}
            valueOptions={valueOptions}
            audience={userRow.user_type === "company" ? "company" : "talent"}
            formAction="/discover"
            preserveView={viewBrowse ? "browse" : null}
          />
        )}
        <DiscoveryScreen
          key={`${screenKey}|${mode}`}
          viewerId={user.id}
          mode={mode}
          title={title}
          subtitle={subtitle}
          cards={cards}
          savedUserIds={savedUserIds}
          feedbackByUser={feedbackByUser}
          acceptedConnectionByUser={acceptedConnectionByUser}
          emptyBody={
            viewPassed
              ? undefined
              : filtersActive
                ? "Nothing matches these filters. Try a broader search."
                : undefined
          }
        />
        {viewPassed ? null : (
          <DiscoveryPagination
            filters={filters}
            total={total}
            pageSize={pageSize}
            view={viewBrowse ? "browse" : null}
          />
        )}
      </div>
    </>
  );
}
