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
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";

function toDisplayRows(
  rows: ConnectionRow[],
  otherIdFn: (row: ConnectionRow) => string,
  info: Map<string, { name: string; subtitle: string; initial: string }>,
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

  const incoming = toDisplayRows(incomingRows, (row) => row.requester_id, info);
  const outgoing = toDisplayRows(outgoingRows, (row) => row.recipient_id, info);
  const accepted = toDisplayRows(
    acceptedRows,
    (row) => (row.requester_id === user.id ? row.recipient_id : row.requester_id),
    info,
  );

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Connections"
      searchPlaceholder={
        userRow.user_type === "company"
          ? "Search candidates or roles"
          : "Search companies"
      }
      userName={accountLabel}
      userInitials={initials}
      userSubtitle={userRow.user_type === "company" ? "Recruiter" : "Talent"}
    >
      <ConnectionsScreen incoming={incoming} outgoing={outgoing} accepted={accepted} />
    </DashboardShell>
  );
}
