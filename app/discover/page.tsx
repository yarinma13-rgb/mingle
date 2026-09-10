import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DiscoveryScreen } from "@/components/discovery/DiscoveryScreen";
import {
  DiscoveryFiltersForm,
  DiscoveryPagination,
} from "@/components/discovery/DiscoveryFilters";
import {
  discoveryFiltersActive,
  parseDiscoveryFilters,
} from "@/lib/discovery/filters";
import { loadDiscoveryPage } from "@/lib/discovery/query";
import { loadSavedUserIds } from "@/lib/matching/saved";
import { loadPassedUserIds } from "@/lib/matching/passed";
import { loadMatchFeedbackMap } from "@/lib/matching/feedback";
import { PROFILE_QUESTIONS } from "@/lib/profile/questions";
import { COMPANY_QUESTIONS } from "@/lib/company-profile/questions";
import { loadShellChrome } from "@/lib/dashboard/require-shell-user";

export default async function DiscoverPage({
  searchParams,
}: PageProps<"/discover">) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type, profile_completion")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  const chrome = await loadShellChrome(
    supabase,
    user,
    userRow.user_type === "company",
  );
  const params = await searchParams;
  const viewRaw = params.view;
  const viewPassed =
    (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "passed";
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

  const [savedUserIds, passedUserIds, feedbackByUser] = await Promise.all([
    loadSavedUserIds(supabase, user.id),
    loadPassedUserIds(supabase, user.id),
    loadMatchFeedbackMap(supabase, user.id),
  ]);
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

  const title = viewPassed
    ? "Passed"
    : userRow.user_type === "company"
      ? "People worth getting to know"
      : "Companies worth getting to know";
  const subtitle = viewPassed
    ? "Everyone you skipped. View again puts them back in Discover."
    : userRow.user_type === "company"
      ? "Every candidate here, scored honestly against your company profile — including where you don't overlap yet."
      : "Every company here, scored honestly against your profile — including where you don't overlap yet.";

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Discover"
      searchPlaceholder={
        userRow.user_type === "company"
          ? "Search candidates or roles"
          : "Search companies"
      }
      userName={chrome.userName}
      userInitials={chrome.initials}
      userGender={chrome.gender}
      userPhoto={chrome.photo}
      userSubtitle={userRow.user_type === "company" ? "Recruiter" : "Talent"}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/discover"
            className={`rounded-full px-4 py-2 font-display text-xs font-semibold ${
              viewPassed
                ? "text-mingle-text-secondary hover:text-mingle-text"
                : "bg-mingle-lavender text-mingle-text"
            }`}
          >
            Discover
          </Link>
          <Link
            href="/discover?view=passed"
            className={`rounded-full px-4 py-2 font-display text-xs font-semibold ${
              viewPassed
                ? "bg-mingle-lavender text-mingle-text"
                : "text-mingle-text-secondary hover:text-mingle-text"
            }`}
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
          />
        )}
        <DiscoveryScreen
          key={`${screenKey}|${viewPassed ? "passed" : "feed"}`}
          viewerId={user.id}
          mode={viewPassed ? "passed" : "feed"}
          title={title}
          subtitle={subtitle}
          cards={cards}
          savedUserIds={savedUserIds}
          feedbackByUser={feedbackByUser}
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
          />
        )}
      </div>
    </DashboardShell>
  );
}
