import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { PasteJobScreen } from "@/components/roles/PasteJobScreen";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";

export default async function PasteRolePage() {
  const { user, shellAvatar } = await requireShellUser({
    userType: "company",
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
      <PasteJobScreen companyId={user.id} />
    </DashboardShell>
  );
}
