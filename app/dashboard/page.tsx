import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanyDashboard, type CandidateRow } from "@/components/dashboard/CompanyDashboard";
import { TalentDashboard, type CompanyRow } from "@/components/dashboard/TalentDashboard";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { companyProfileCompletion } from "@/lib/company-profile/persistence";
import { buildCandidateDna } from "@/lib/matching/dna";
import { computeMatch } from "@/lib/matching/engine";
import { matchScore } from "@/lib/profile-detail/why-match";
import {
  loadTalentMatchInput,
  loadCompanyMatchInput,
} from "@/lib/matching/context";
import { loadCompanyFunnel } from "@/lib/dashboard/funnel";
import { loadTalentDashboardStats } from "@/lib/dashboard/talent-stats";
import { loadShellChrome } from "@/lib/dashboard/require-shell-user";
import { personInitials } from "@/lib/profile/avatar";
import { resolveTalentPhotoUrls } from "@/lib/profile/photo";
import { profileCompletion } from "@/lib/profile/persistence";

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
    const [{ data: ownProfileRow }, { data: talentRows }, funnel] =
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
          profileCompletion={
            ownProfile
              ? companyProfileCompletion(ownProfile)
              : userRow.profile_completion
          }
          candidates={candidates}
          accountLabel={chrome.userName}
          funnel={funnel}
        />
      </DashboardShell>
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

  const companies: CompanyRow[] = [];
  for (const row of companyRows ?? []) {
    if (!row.company_name) continue;
    const company = toCompanyProfile(row);
    const companyInput = await loadCompanyMatchInput(supabase, row.user_id);
    const score =
      ownMatchInput && companyInput
        ? computeMatch(ownMatchInput, companyInput).score
        : 0;
    companies.push({
      userId: row.user_id,
      companyName: company.companyName,
      mission: company.mission,
      industry: company.industry,
      location: company.location,
      matchScore: score,
    });
  }

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
        profileCompletion={liveCompletion}
        companies={companies}
        dna={ownProfile ? buildCandidateDna(ownProfile) : null}
        stats={stats}
        missingPhoto={!ownProfile?.profilePhoto}
      />
    </DashboardShell>
  );
}
