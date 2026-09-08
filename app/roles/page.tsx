import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RolesScreen } from "@/components/roles/RolesScreen";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import {
  isMissingRolesTable,
  loadCompanyRoles,
  type RoleRecord,
} from "@/lib/roles/persistence";

export default async function RolesPage() {
  const { supabase, user, shellAvatar } = await requireShellUser({
    userType: "company",
  });

  let roles: RoleRecord[] = [];
  let tableMissing = false;
  try {
    roles = await loadCompanyRoles(supabase, user.id);
  } catch (error) {
    tableMissing = isMissingRolesTable(
      error && typeof error === "object"
        ? (error as { message?: string; code?: string })
        : null,
    );
    if (!tableMissing) throw error;
  }

  return (
    <DashboardShell
      userType="company"
      userId={user.id}
      title="Roles"
      searchPlaceholder="Search candidates or roles"
      userSubtitle="Recruiter"
      {...shellAvatar}
    >
      <RolesScreen
        companyId={user.id}
        initialRoles={roles}
        tableMissing={tableMissing}
      />
    </DashboardShell>
  );
}
