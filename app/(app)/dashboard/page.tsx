import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { CompanyDashboard, type CandidateRow } from "@/components/dashboard/CompanyDashboard";
import { TalentDashboard, type CompanyRow } from "@/components/dashboard/TalentDashboard";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { companyProfileCompletion } from "@/lib/company-profile/persistence";
import { buildCandidateDna } from "@/lib/matching/dna";
import { computeMatch } from "@/lib/matching/engine";
import {
  loadTalentMatchInput,
  loadCompanyMatchInput,
} from "@/lib/matching/context";
import { loadCompanyFunnel } from "@/lib/dashboard/funnel";
import { loadTalentDashboardStats } from "@/lib/dashboard/talent-stats";
import { loadCompanyInterviews } from "@/lib/interviews/persistence";
import { loadCompanyRoles } from "@/lib/roles/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import type { UpcomingInterviewRow } from "@/components/dashboard/UpcomingInterviewsCard";
import { requireAppUser, requireShellUser } from "@/lib/dashboard/require-shell-user";
import { personInitials } from "@/lib/profile/avatar";
import { resolveTalentPhotoUrls } from "@/lib/profile/photo";
import { profileCompletion } from "@/lib/profile/persistence";
import { AccountRestoredBanner } from "@/components/settings/AccountRestoredBanner";

export default async function DashboardPage() {
  const { supabase, user, userRow } = await requireAppUser();
  const { shellAvatar } = await requireShellUser();

  if (userRow.user_type === "company") {
    const [
      { data: ownProfileRow },
      { data: talentRows },
      funnel,
      ownMatchInput,
    ] = await Promise.all([
      supabase
        .from("company_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("talent_profiles")
        .select("*")
        .neq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(8),
      loadCompanyFunnel(supabase, user.id),
      loadCompanyMatchInput(supabase, user.id),
    ]);
    const ownProfile = ownProfileRow ? toCompanyProfile(ownProfileRow) : null;

    const [interviews, roles] = await Promise.all([
      loadCompanyInterviews(supabase, user.id),
      loadCompanyRoles(supabase, user.id),
    ]);
    const activeRolesCount = roles.filter((role) => role.status === "open").length;

    const now = Date.now();
    const upcomingRaw = interviews
      .filter(
        (interview) =>
          interview.status === "scheduled" &&
          new Date(interview.scheduledAt).getTime() >= now,
      )
      .slice(0, 3);

    let upcomingInterviews: UpcomingInterviewRow[] = [];
    if (upcomingRaw.length > 0) {
      const { data: connRows } = await supabase
        .from("connections")
        .select("id, requester_id, recipient_id")
        .in(
          "id",
          upcomingRaw.map((interview) => interview.connectionId),
        );
      const connById = new Map((connRows ?? []).map((row) => [row.id, row]));
      const otherIds = (connRows ?? []).map((row) =>
        row.requester_id === user.id ? row.recipient_id : row.requester_id,
      );
      const info = await loadDisplayInfoForUsers(supabase, otherIds);
      upcomingInterviews = upcomingRaw.map((interview) => {
        const conn = connById.get(interview.connectionId);
        const otherId = conn
          ? conn.requester_id === user.id
            ? conn.recipient_id
            : conn.requester_id
          : null;
        const display = otherId ? info.get(otherId) : null;
        return {
          id: interview.id,
          otherName: display?.name ?? "Candidate",
          scheduledAt: interview.scheduledAt,
        };
      });
    }

    const scored = await Promise.all(
      (talentRows ?? []).map(async (row) => {
        if (!row.first_name) return null;
        const talent = toTalentProfile(row);
        const talentInput = await loadTalentMatchInput(supabase, row.user_id);
        const score =
          ownMatchInput && talentInput
            ? computeMatch(talentInput, ownMatchInput).score
            : 0;
        return {
          userId: row.user_id,
          name: `${talent.firstName} ${talent.lastName}`.trim(),
          headline: talent.headline,
          location: talent.location,
          matchScore: score,
          updatedAt: row.updated_at,
          initials: personInitials(talent.firstName, talent.lastName),
          gender: talent.gender,
          photo: talent.profilePhoto,
        } satisfies CandidateRow;
      }),
    );
    const candidates = scored.filter((row): row is CandidateRow => row !== null);
    const photoUrls = await resolveTalentPhotoUrls(
      supabase,
      candidates.map((row) => row.photo),
    );
    for (const row of candidates) {
      const resolved = row.photo ? photoUrls.get(row.photo) : null;
      if (resolved) row.photo = resolved;
    }

    return (
      <>
        <AccountRestoredBanner />
      <DashboardHeading>Dashboard</DashboardHeading>
        <CompanyDashboard
          profileCompletion={
            ownProfile
              ? companyProfileCompletion(ownProfile)
              : userRow.profile_completion
          }
          candidates={candidates}
          accountLabel={shellAvatar.userName}
          funnel={funnel}
          activeRolesCount={activeRolesCount}
          upcomingInterviews={upcomingInterviews}
        />
      </>
    );
  }

  const [
    { data: ownProfileRow },
    { data: companyRows },
    stats,
    ownMatchInput,
  ] = await Promise.all([
    supabase
      .from("talent_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("company_profiles")
      .select("*")
      .neq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(6),
    loadTalentDashboardStats(supabase, user.id),
    loadTalentMatchInput(supabase, user.id),
  ]);
  const ownProfile = ownProfileRow ? toTalentProfile(ownProfileRow) : null;
  const liveCompletion = ownProfile
    ? profileCompletion(ownProfile)
    : userRow.profile_completion;

  const scoredCompanies = await Promise.all(
    (companyRows ?? []).map(async (row): Promise<CompanyRow | null> => {
      if (!row.company_name) return null;
      const company = toCompanyProfile(row);
      const companyInput = await loadCompanyMatchInput(supabase, row.user_id);
      const score =
        ownMatchInput && companyInput
          ? computeMatch(ownMatchInput, companyInput).score
          : 0;
      return {
        userId: row.user_id,
        companyName: company.companyName,
        mission: company.mission,
        industry: company.industry,
        location: company.location,
        matchScore: score,
        updatedAt: row.updated_at,
      };
    }),
  );
  const companies = scoredCompanies.filter(
    (row): row is CompanyRow => row !== null,
  );

  return (
    <>
      <AccountRestoredBanner />
      <DashboardHeading>Dashboard</DashboardHeading>
      <TalentDashboard
        profileCompletion={liveCompletion}
        companies={companies}
        dna={ownProfile ? buildCandidateDna(ownProfile) : null}
        stats={stats}
        missingPhoto={!ownProfile?.profilePhoto}
      />
    </>
  );
}
