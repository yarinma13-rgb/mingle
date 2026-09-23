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
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";
import { loadOpenRoleRediscoveryByCandidate } from "@/lib/matching/rediscovery";
import { loadNotesForConnections } from "@/lib/notes/persistence";

export default async function BoardPage() {
  const { supabase, user, userRow } = await requireAppUser();
  if (userRow.user_type !== "company") redirect("/connections");

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);

  const acceptedRows = await loadAcceptedConnections(supabase, companyId);
  const otherIds = acceptedRows.map((row) =>
    row.requester_id === companyId ? row.recipient_id : row.requester_id,
  );
  const [info, timelines, rediscoveryByUser, notesByConnection] = await Promise.all([
    loadDisplayInfoForUsers(supabase, otherIds),
    loadTimelinesForConnections(
      supabase,
      acceptedRows.map((row) => row.id),
    ),
    loadOpenRoleRediscoveryByCandidate(supabase, companyId),
    loadNotesForConnections(
      supabase,
      acceptedRows.map((row) => row.id),
    ),
  ]);

  const candidates: BoardCandidate[] = [];
  for (const row of acceptedRows) {
    const otherId =
      row.requester_id === companyId ? row.recipient_id : row.requester_id;
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

  const candidatesWithExtras = candidates.map((candidate) => {
    const note = notesByConnection.get(candidate.connectionId);
    return {
      ...candidate,
      rediscovery: rediscoveryByUser[candidate.userId] ?? null,
      note: note ? { notes: note.notes, tags: note.tags } : null,
    };
  });

  return (
    <>
      <DashboardHeading>Board</DashboardHeading>
      <CompanyBoardScreen actorId={user.id} candidates={candidatesWithExtras} />
    </>
  );
}
