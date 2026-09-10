import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanyDashboard, type CandidateRow } from "@/components/dashboard/CompanyDashboard";
import { TalentDashboard, type CompanyRow } from "@/components/dashboard/TalentDashboard";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { buildCandidateDna } from "@/lib/matching/dna";
import { matchScore } from "@/lib/profile-detail/why-match";
import { loadCompanyFunnel } from "@/lib/dashboard/funnel";
import {
  loadCompanyKpiTrends,
  loadTalentKpiTrends,
} from "@/lib/dashboard/kpi-trends";
import { loadShellChrome } from "@/lib/dashboard/require-shell-user";
import { personInitials } from "@/lib/profile/avatar";
import { resolveTalentPhotoUrls } from "@/lib/profile/photo";

export default async function DashboardPage() {
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

  if (userRow.user_type === "company") {
    const [{ data: ownProfileRow }, { data: talentRows }, funnel, trends] =
      await Promise.all([
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
        loadCompanyKpiTrends(supabase, user.id),
      ]);
    const ownProfile = ownProfileRow ? toCompanyProfile(ownProfileRow) : null;

    const candidates: CandidateRow[] = (talentRows ?? [])
      .filter((row) => row.first_name)
      .map((row) => {
        const talent = toTalentProfile(row);
        return {
          userId: row.user_id,
          name: `${talent.firstName} ${talent.lastName}`.trim(),
          headline: talent.headline,
          location: talent.location,
          matchScore: ownProfile ? matchScore(talent, ownProfile) : 75,
          updatedAt: row.updated_at,
          initials: personInitials(talent.firstName, talent.lastName),
          gender: talent.gender,
          photo: talent.profilePhoto,
        };
      });
    const photoUrls = await resolveTalentPhotoUrls(
      supabase,
      candidates.map((row) => row.photo),
    );
    for (const row of candidates) {
      const resolved = row.photo ? photoUrls.get(row.photo) : null;
      if (resolved) row.photo = resolved;
    }

    return (
      <DashboardShell
        userType="company"
        userId={user.id}
        title="Dashboard"
        searchPlaceholder="Search candidates or roles"
        userName={chrome.userName}
        userInitials={chrome.initials}
        userGender={chrome.gender}
        userPhoto={chrome.photo}
        userSubtitle="Recruiter"
      >
        <CompanyDashboard
          profileCompletion={userRow.profile_completion}
          candidates={candidates}
          accountLabel={chrome.userName}
          funnel={funnel}
          trends={{
            connections: trends.connections.percent,
            conversations: trends.conversations.percent,
            opportunities: trends.opportunities.percent,
          }}
        />
      </DashboardShell>
    );
  }

  const [{ data: ownProfileRow }, { data: companyRows }, talentTrends] =
    await Promise.all([
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
    loadTalentKpiTrends(supabase, user.id),
  ]);
  const ownProfile = ownProfileRow ? toTalentProfile(ownProfileRow) : null;

  const companies: CompanyRow[] = (companyRows ?? [])
    .filter((row) => row.company_name)
    .map((row) => {
      const company = toCompanyProfile(row);
      return {
        userId: row.user_id,
        companyName: company.companyName,
        mission: company.mission,
        industry: company.industry,
        location: company.location,
        matchScore: ownProfile ? matchScore(ownProfile, company) : 75,
      };
    });

  return (
    <DashboardShell
      userType="talent"
      userId={user.id}
      title="Dashboard"
      searchPlaceholder="Search companies"
      userName={chrome.userName}
      userInitials={chrome.initials}
      userGender={chrome.gender}
      userPhoto={chrome.photo}
      userSubtitle="Talent"
    >
      <TalentDashboard
        trends={{
          connections: talentTrends.connections.percent,
          conversations: talentTrends.conversations.percent,
        }}
        profileCompletion={userRow.profile_completion}
        companies={companies}
        dna={ownProfile ? buildCandidateDna(ownProfile) : null}
      />
    </DashboardShell>
  );
}
