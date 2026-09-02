import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CompanyDashboard, type CandidateRow } from "@/components/dashboard/CompanyDashboard";
import { TalentDashboard, type CompanyRow } from "@/components/dashboard/TalentDashboard";
import { toTalentProfile, toCompanyProfile } from "@/lib/profile-detail/adapters";
import { matchScore } from "@/lib/profile-detail/why-match";

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

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();

  if (userRow.user_type === "company") {
    const { data: ownProfileRow } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    const ownProfile = ownProfileRow ? toCompanyProfile(ownProfileRow) : null;

    const { data: talentRows } = await supabase
      .from("talent_profiles")
      .select("*")
      .neq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(8);

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
        };
      });

    return (
      <DashboardShell
        userType="company"
        userId={user.id}
        title="Dashboard"
        searchPlaceholder="Search candidates or roles"
        userName={accountLabel}
        userInitials={initials}
        userSubtitle="Recruiter"
      >
        <CompanyDashboard
          profileCompletion={userRow.profile_completion}
          candidates={candidates}
          accountLabel={accountLabel}
        />
      </DashboardShell>
    );
  }

  const { data: ownProfileRow } = await supabase
    .from("talent_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const ownProfile = ownProfileRow ? toTalentProfile(ownProfileRow) : null;

  const { data: companyRows } = await supabase
    .from("company_profiles")
    .select("*")
    .neq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(6);

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
      userName={accountLabel}
      userInitials={initials}
      userSubtitle="Talent"
    >
      <TalentDashboard
        profileCompletion={userRow.profile_completion}
        companies={companies}
      />
    </DashboardShell>
  );
}
