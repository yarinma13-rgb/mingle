import { SettingsHub } from "@/components/settings/SettingsHub";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { getCandidateVisibility } from "@/lib/talent-exchange/persistence";

export default async function SettingsPage() {
  const { supabase, user, isCompany, accountLabel } = await requireAppUser();
  const profileHref = isCompany ? "/company-profile/build" : "/profile/build";
  const visibilityStatus = isCompany
    ? null
    : await getCandidateVisibility(supabase, user.id);

  return (
    <>
      <DashboardHeading>Settings</DashboardHeading>
      <SettingsHub
        email={user.email ?? accountLabel}
        pathLabel={isCompany ? "Company" : "Talent"}
        profileHref={profileHref}
        isCompany={isCompany}
        candidateId={user.id}
        visibilityStatus={visibilityStatus}
      />
    </>
  );
}
