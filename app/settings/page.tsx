import { SettingsHub } from "@/components/settings/SettingsHub";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function SettingsPage() {
  const { user, userRow, isCompany, shellAvatar, accountLabel } =
    await requireShellUser();
  const profileHref = isCompany ? "/company-profile/build" : "/profile/build";

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Settings"
      searchPlaceholder={
        isCompany ? "Search candidates or roles" : "Search companies"
      }
      userSubtitle={isCompany ? "Recruiter" : "Talent"}
      {...shellAvatar}
    >
      <SettingsHub
        email={user.email ?? accountLabel}
        pathLabel={isCompany ? "Company" : "Talent"}
        profileHref={profileHref}
        isCompany={isCompany}
      />
    </DashboardShell>
  );
}
