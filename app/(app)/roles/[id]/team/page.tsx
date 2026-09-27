import { RoleTeamAccessScreen } from "@/components/roles/RoleTeamAccessScreen";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import { loadCollaboratorsForConnections } from "@/lib/collaborators/persistence";

export default async function RoleTeamAccessPage() {
  const { supabase, user } = await requireAppUser({ userType: "company" });
  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);

  const accepted = await loadAcceptedConnections(supabase, companyId);
  const talentIds = accepted.map((row) =>
    row.requester_id === companyId ? row.recipient_id : row.requester_id,
  );
  const info = await loadDisplayInfoForUsers(supabase, talentIds);
  const collaboratorsByConnection = await loadCollaboratorsForConnections(
    supabase,
    accepted.map((row) => row.id),
  );

  const candidates = accepted
    .map((row) => {
      const talentId =
        row.requester_id === companyId ? row.recipient_id : row.requester_id;
      const display = info.get(talentId);
      const collaborators = collaboratorsByConnection.get(row.id) ?? [];
      if (!display || collaborators.length === 0) return null;
      return {
        connectionId: row.id,
        userId: talentId,
        name: display.name,
        initial: display.initial,
        photo: display.photo,
        gender: display.gender,
        collaborators,
      };
    })
    .filter((row) => row !== null);

  return <RoleTeamAccessScreen candidates={candidates} />;
}
