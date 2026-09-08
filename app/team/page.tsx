import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { TeamScreen } from "@/components/team/TeamScreen";
import { requireShellUser } from "@/lib/dashboard/require-shell-user";
import {
  isMissingTeamTable,
  loadTeamMembers,
  resolveCompanyWorkspaceId,
  type TeamMemberRow,
} from "@/lib/team/persistence";

export default async function TeamPage() {
  const { supabase, user, accountLabel, shellAvatar } = await requireShellUser({
    userType: "company",
  });

  const workspaceId = await resolveCompanyWorkspaceId(supabase, user.id);
  const canInvite = workspaceId === user.id;

  let members: TeamMemberRow[] = [];
  let tableMissing = false;
  try {
    members = await loadTeamMembers(supabase, canInvite ? user.id : workspaceId);
  } catch (error) {
    tableMissing = isMissingTeamTable(
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
      title="Team"
      searchPlaceholder="Search candidates or roles"
      userSubtitle="Recruiter"
      {...shellAvatar}
    >
      <TeamScreen
        accountLabel={shellAvatar.userName || accountLabel}
        userPhoto={shellAvatar.userPhoto}
        userInitials={shellAvatar.userInitials}
        members={members}
        tableMissing={tableMissing}
        canInvite={canInvite}
      />
    </DashboardShell>
  );
}
