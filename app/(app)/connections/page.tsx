import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
import {
  ConnectionsScreen,
  type ConnectionDisplayRow,
} from "@/components/connections/ConnectionsScreen";
import {
  loadIncomingPending,
  loadOutgoingPending,
  loadAcceptedConnections,
  type ConnectionRow,
} from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers, type ConnectionDisplayInfo } from "@/lib/connections/enrich";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadTimelinesForConnections, latestStage } from "@/lib/relationship/persistence";

function toDisplayRows(
  rows: ConnectionRow[],
  otherIdFn: (row: ConnectionRow) => string,
  info: Map<string, ConnectionDisplayInfo>,
): ConnectionDisplayRow[] {
  return rows
    .map((row) => {
      const otherId = otherIdFn(row);
      const display = info.get(otherId);
      if (!display) return null;
      return { connectionId: row.id, userId: otherId, ...display };
    })
    .filter((row): row is ConnectionDisplayRow => row !== null);
}

export default async function ConnectionsPage() {
  const { supabase, user, userRow } = await requireAppUser();
  const companyId =
    userRow.user_type === "company"
      ? await resolveCompanyWorkspaceId(supabase, user.id)
      : user.id;

  const [incomingRows, outgoingRows, acceptedRows] = await Promise.all([
    loadIncomingPending(supabase, companyId),
    loadOutgoingPending(supabase, companyId),
    loadAcceptedConnections(supabase, companyId),
  ]);

  const otherIds = new Set<string>();
  incomingRows.forEach((row) => otherIds.add(row.requester_id));
  outgoingRows.forEach((row) => otherIds.add(row.recipient_id));
  acceptedRows.forEach((row) =>
    otherIds.add(row.requester_id === companyId ? row.recipient_id : row.requester_id),
  );

  const [info, timelines] = await Promise.all([
    loadDisplayInfoForUsers(supabase, [...otherIds]),
    userRow.user_type === "company"
      ? loadTimelinesForConnections(
          supabase,
          acceptedRows.map((row) => row.id),
        )
      : Promise.resolve(null),
  ]);

  const incoming = toDisplayRows(incomingRows, (row) => row.requester_id, info);
  const outgoing = toDisplayRows(outgoingRows, (row) => row.recipient_id, info);
  const accepted = toDisplayRows(
    acceptedRows,
    (row) => (row.requester_id === companyId ? row.recipient_id : row.requester_id),
    info,
  ).map((row) => ({
    ...row,
    stage: timelines
      ? latestStage(timelines.get(row.connectionId) ?? [])
      : undefined,
  }));

  return (
    <>
      <DashboardHeading>
        {userRow.user_type === "company" ? "Pipeline" : "Connections"}
      </DashboardHeading>
      <ConnectionsScreen
        incoming={incoming}
        outgoing={outgoing}
        accepted={accepted}
        variant={userRow.user_type === "company" ? "pipeline" : "connections"}
      />
    </>
  );
}
