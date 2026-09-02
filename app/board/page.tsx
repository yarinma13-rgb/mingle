import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  CompanyBoardScreen,
  type BoardCandidate,
} from "@/components/board/CompanyBoardScreen";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadDisplayInfoForUsers } from "@/lib/connections/enrich";
import {
  ensureConnectedEvent,
  loadTimeline,
  loadTimelinesForConnections,
} from "@/lib/relationship/persistence";

export default async function BoardPage() {
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
  if (userRow.user_type !== "company") redirect("/connections");

  const acceptedRows = await loadAcceptedConnections(supabase, user.id);
  const otherIds = acceptedRows.map((row) =>
    row.requester_id === user.id ? row.recipient_id : row.requester_id,
  );
  const info = await loadDisplayInfoForUsers(supabase, otherIds);
  const timelines = await loadTimelinesForConnections(
    supabase,
    acceptedRows.map((row) => row.id),
  );

  const candidates: BoardCandidate[] = [];
  for (const row of acceptedRows) {
    const otherId =
      row.requester_id === user.id ? row.recipient_id : row.requester_id;
    const display = info.get(otherId);
    if (!display) continue;

    let timeline = timelines.get(row.id) ?? [];
    try {
      const created = await ensureConnectedEvent(supabase, row.id, timeline);
      if (created) timeline = await loadTimeline(supabase, row.id);
    } catch {
      // Table not migrated yet: still show the card in Connected.
    }

    candidates.push({
      connectionId: row.id,
      userId: otherId,
      name: display.name,
      subtitle: display.subtitle,
      initial: display.initial,
      timeline,
    });
  }

  const accountLabel = user.email?.split("@")[0] ?? "You";
  const initials = accountLabel.slice(0, 2).toUpperCase();

  return (
    <DashboardShell
      userType={userRow.user_type}
      userId={user.id}
      title="Board"
      searchPlaceholder="Search candidates or roles"
      userName={accountLabel}
      userInitials={initials}
      userSubtitle="Recruiter"
    >
      <CompanyBoardScreen actorId={user.id} candidates={candidates} />
    </DashboardShell>
  );
}
