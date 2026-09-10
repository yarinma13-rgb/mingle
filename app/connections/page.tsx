import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
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
import { loadShellChrome } from "@/lib/dashboard/require-shell-user";
import { loadTimelinesForConnections, latestStage } from "@/lib/relationship/persistence";
import { loadCompanyRoles } from "@/lib/roles/persistence";
import {
  emptyFunnelCounts,
  type PipelineBarRow,
} from "@/components/connections/PipelineSegmentBars";

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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow) redirect("/auth");

  const [incomingRows, outgoingRows, acceptedRows] = await Promise.all([
    loadIncomingPending(supabase, user.id),
    loadOutgoingPending(supabase, user.id),
    loadAcceptedConnections(supabase, user.id),
  ]);

  const otherIds = new Set<string>();
  incomingRows.forEach((row) => otherIds.add(row.requester_id));
  outgoingRows.forEach((row) => otherIds.add(row.recipient_id));
  acceptedRows.forEach((row) =>
    otherIds.add(row.requester_id === user.id ? row.recipient_id : row.requester_id),
  );

  const info = await loadDisplayInfoForUsers(supabase, [...otherIds]);
  const timelines =
    userRow.user_type === "company"
      ? await loadTimelinesForConnections(
          supabase,
          acceptedRows.map((row) => row.id),
        )
      : null;

  const incoming = toDisplayRows(incomingRows, (row) => row.requester_id, info);
  const outgoing = toDisplayRows(outgoingRows, (row) => row.recipient_id, info);
  const accepted = toDisplayRows(
    acceptedRows,
    (row) => (row.requester_id === user.id ? row.recipient_id : row.requester_id),
    info,
  ).map((row) => ({
    ...row,
    stage: timelines
      ? latestStage(timelines.get(row.connectionId) ?? [])
      : undefined,
  }));


  let roleBars: PipelineBarRow[] = [];
  if (userRow.user_type === "company") {
    try {
      const roles = await loadCompanyRoles(supabase, user.id);
      roleBars = roles
        .filter((role) => role.status === "open" || role.status === "paused")
        .map((role) => ({
          id: role.id,
          label: role.title,
          // Roles are not yet linked to connection stages in schema.
          // Show an empty bar so the layout matches the mock; counts stay honest.
          counts: emptyFunnelCounts(),
          href: `/roles/${role.id}/matches`,
        }));
    } catch {
      roleBars = [];
    }
  }

  const chrome = await loadShellChrome(
    supabase,
    user,
    userRow.user_type === "company",
  );

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title={userRow.user_type === "company" ? "Pipeline" : "Connections"}
      searchPlaceholder={
        userRow.user_type === "company"
          ? "Search candidates or roles"
          : "Search companies"
      }
      userName={chrome.userName}
      userInitials={chrome.initials}
      userGender={chrome.gender}
      userPhoto={chrome.photo}
      userSubtitle={userRow.user_type === "company" ? "Recruiter" : "Talent"}
    >
      <ConnectionsScreen
        incoming={incoming}
        outgoing={outgoing}
        accepted={accepted}
        variant={userRow.user_type === "company" ? "pipeline" : "connections"}
        roleBars={roleBars}
      />
    </DashboardShell>
  );
}
