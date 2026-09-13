import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RoleMatchesScreen } from "@/components/roles/RoleMatchesScreen";
import {
  DiscoveryFiltersForm,
} from "@/components/discovery/DiscoveryFilters";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import { parseDiscoveryFilters } from "@/lib/discovery/filters";
import { loadDiscoveryPage } from "@/lib/discovery/query";
import { loadPassedUserIds } from "@/lib/matching/passed";
import { loadMatchFeedbackMap } from "@/lib/matching/feedback";
import { loadCompanyRole } from "@/lib/roles/persistence";
import { queueRoleMatches } from "@/lib/admin/reviews";
import {
  ensureRediscoveryForRole,
  loadRediscoveryBadgeMap,
} from "@/lib/matching/rediscovery";
import { PROFILE_QUESTIONS } from "@/lib/profile/questions";
import { notFound } from "next/navigation";

export default async function RoleMatchesPage({
  params,
  searchParams,
}: PageProps<"/roles/[id]/matches">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user, shellAvatar } = await requireShellUser({
    userType: "company",
  });

  const role = await loadCompanyRole(supabase, id, user.id);
  if (!role) notFound();

  const filters = parseDiscoveryFilters(query);
  const styleOptions =
    PROFILE_QUESTIONS.find((question) => question.key === "workStyle")
      ?.options ?? [];
  const valueOptions =
    PROFILE_QUESTIONS.find((question) => question.key === "drives")?.options ??
    [];

  const [passedUserIds, feedbackByUser] = await Promise.all([
    loadPassedUserIds(supabase, user.id),
    loadMatchFeedbackMap(supabase, user.id),
  ]);

  await ensureRediscoveryForRole(supabase, {
    companyId: user.id,
    roleId: role.id,
    roleTitle: role.title,
  });
  const rediscoveryByUser = await loadRediscoveryBadgeMap(supabase, role.id);
  const rediscoveredIds = new Set(Object.keys(rediscoveryByUser));
  const excludeUserIds = passedUserIds.filter((id) => !rediscoveredIds.has(id));

  const ranked = await loadDiscoveryPage(
    supabase,
    { id: user.id, userType: "company" },
    filters,
    styleOptions,
    { excludeUserIds, rankAll: true },
  );
  const cards = [...ranked.cards].sort((a, b) => {
    const ar = rediscoveredIds.has(a.userId) ? 1 : 0;
    const br = rediscoveredIds.has(b.userId) ? 1 : 0;
    if (ar !== br) return br - ar;
    return b.score - a.score;
  });

  const { data: companyRow } = await supabase
    .from("company_profiles")
    .select("company_name")
    .eq("user_id", user.id)
    .maybeSingle();
  await queueRoleMatches(supabase, {
    roleId: role.id,
    companyId: user.id,
    jobTitle: role.title,
    companyName: companyRow?.company_name ?? "",
    cards,
  });

  return (
    <DashboardShell
      userType="company"
      userId={user.id}
      title="Roles"
      searchPlaceholder="Search candidates or roles"
      userSubtitle="Recruiter"
      {...shellAvatar}
    >
      <RoleMatchesScreen
        roleId={role.id}
        roleTitle={role.title}
        cards={cards}
        total={ranked.total}
        rediscoveryByUser={rediscoveryByUser}
        viewerId={user.id}
        feedbackByUser={feedbackByUser}
        filters={
          <DiscoveryFiltersForm
            filters={filters}
            styleOptions={styleOptions}
            valueOptions={valueOptions}
            audience="company"
            formAction={`/roles/${role.id}/matches`}
          />
        }
      />
    </DashboardShell>
  );
}
