import { redirect } from "next/navigation";
import { DashboardHeading } from "@/components/dashboard/DashboardHeading";
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
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { loadOpenRoleRediscoveryByCandidate } from "@/lib/matching/rediscovery";

export default async function BoardPage() {
  const { supabase, user, userRow } = await requireAppUser();
  if (userRow.user_type !== "company") redirect("/connections");

  const acceptedRows = await loadAcceptedConnections(supabase, user.id);
  const otherIds = acceptedRows.map((row) =>
    row.requester_id === user.id ? row.recipient_id : row.requester_id,
  );
  const [info, timelines, rediscoveryByUser] = await Promise.all([
    loadDisplayInfoForUsers(supabase, otherIds),
    loadTimelinesForConnections(
      supabase,
      acceptedRows.map((row) => row.id),
    ),
    loadOpenRoleRediscoveryByCandidate(supabase, user.id),
  ]);

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
      photo: display.photo,
      gender: display.gender,
      timeline,
    });
  }

  const candidatesWithRediscovery = candidates.map((candidate) => ({
    ...candidate,
    rediscovery: rediscoveryByUser[candidate.userId] ?? null,
  }));

  return (
    <>
      <DashboardHeading>Board</DashboardHeading>
      <CompanyBoardScreen actorId={user.id} candidates={candidatesWithRediscovery} />
    </>
  );
}
