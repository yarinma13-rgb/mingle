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

  const [savedUserIds, { cards, total, pageSize }] = await Promise.all([
    loadSavedUserIds(supabase, user.id),
    loadDiscoveryPage(
      supabase,
      { id: user.id, userType: userRow.user_type },
      filters,
      styleOptions,
    ),
  ]);

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

  const title =
    userRow.user_type === "company"
      ? "People worth getting to know"
      : "Companies worth getting to know";
  const subtitle =
    userRow.user_type === "company"
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
        <DiscoveryFiltersForm
          filters={filters}
          styleOptions={styleOptions}
          valueOptions={valueOptions}
          audience={userRow.user_type === "company" ? "company" : "talent"}
        />
        <DiscoveryScreen
          key={screenKey}
          title={title}
          subtitle={subtitle}
          cards={cards}
          savedUserIds={savedUserIds}
          emptyBody={
            filtersActive
              ? "Nothing matches these filters. Try a broader search."
              : undefined
          }
        />
        <DiscoveryPagination
          filters={filters}
          total={total}
          pageSize={pageSize}
        />
      </div>
    </DashboardShell>
  );
}
