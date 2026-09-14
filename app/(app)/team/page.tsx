import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import { TeamScreen } from "@/components/team/TeamScreen";
import { requireAppUser, requireShellUser } from "@/lib/dashboard/require-shell-user";
import {
  isMissingTeamTable,
  loadTeamMembers,
  resolveCompanyWorkspaceId,
  type TeamMemberRow,
} from "@/lib/team/persistence";

export default async function TeamPage() {
  // Shell chrome is served by the shared layout; reuse cached auth here.
  const { supabase, user, accountLabel } = await requireAppUser({
    userType: "company",
  });
  // Avatar fields for TeamScreen (owner row) — cheap when layout already loaded chrome.
  const { shellAvatar } = await requireShellUser({ userType: "company" });

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
    <>
      <DashboardHeading>Team</DashboardHeading>
      <TeamScreen
        accountLabel={shellAvatar.userName || accountLabel}
        userPhoto={shellAvatar.userPhoto}
        userInitials={shellAvatar.userInitials}
        members={members}
        tableMissing={tableMissing}
        canInvite={canInvite}
      />
    </>
  );
}
