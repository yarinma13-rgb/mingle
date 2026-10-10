import { SettingsHub } from "@/components/settings/SettingsHub";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";

export default async function SettingsPage() {
  const { user, isCompany, accountLabel } = await requireAppUser();
  const profileHref = isCompany ? "/company-profile/build" : "/profile/build";

  return (
    <>
      <DashboardHeading>Settings</DashboardHeading>
      <SettingsHub
        email={user.email ?? accountLabel}
        pathLabel={isCompany ? "Company" : "Talent"}
        profileHref={profileHref}
        isCompany={isCompany}
      />
    </>
  );
}
