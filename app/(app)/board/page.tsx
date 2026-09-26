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
import { loadCompanyRoles, type RoleRecord } from "@/lib/roles/persistence";
import { loadCompanyMatchInput, loadTalentMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";
import { buildMatchReport } from "@/lib/matching/report";
import type { RelationshipEventRow } from "@/lib/relationship/persistence";

/** Best-effort: connections aren't linked to a role by id, only by the
 * free-text role name recorded on the "opportunity" timeline event (see
 * lib/relationship/persistence.ts createOpportunity). Falls back to no
 * role match (still scores against the general company profile) rather
 * than guessing. */
function findOriginatingRole(
  timeline: RelationshipEventRow[],
  roles: RoleRecord[],
): RoleRecord | null {
  const opportunityEvent = timeline.find((event) => event.stage === "opportunity");
  const roleName =
    typeof opportunityEvent?.metadata === "object" &&
    opportunityEvent.metadata &&
    "role" in opportunityEvent.metadata
      ? String((opportunityEvent.metadata as { role?: unknown }).role ?? "").trim()
      : "";
  if (!roleName) return null;
  return (
    roles.find((role) => role.title.trim().toLowerCase() === roleName.toLowerCase()) ?? null
  );
}

export default async function BoardPage() {
  const { supabase, user, userRow } = await requireAppUser();
  if (userRow.user_type !== "company") redirect("/connections");

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);

  const acceptedRows = await loadAcceptedConnections(supabase, companyId);
  const otherIds = acceptedRows.map((row) =>
    row.requester_id === companyId ? row.recipient_id : row.requester_id,
  );
  const [info, timelines, rediscoveryByUser, notesByConnection, companyRoles, companyMatchInput] =
    await Promise.all([
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
      loadCompanyRoles(supabase, companyId).catch(() => [] as RoleRecord[]),
      loadCompanyMatchInput(supabase, companyId),
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

    let matchReportForCandidate = null;
    let matchRoleTitle: string | null = null;
    let matchRoleId: string | null = null;
    if (companyMatchInput) {
      const originatingRole = findOriginatingRole(timeline, companyRoles);
      const talentInput = await loadTalentMatchInput(supabase, otherId);
      if (talentInput) {
        const scopedCompanyInput: CompanyMatchInput = originatingRole
          ? {
              ...companyMatchInput,
              roleTitle: originatingRole.title,
              roleDepartment: originatingRole.department,
              roleRequiredSkills: originatingRole.requiredSkills,
              roleSkillRequirements: originatingRole.skillRequirements,
              salaryMin: originatingRole.salaryMin,
              salaryMax: originatingRole.salaryMax,
            }
          : companyMatchInput;
        matchReportForCandidate = buildMatchReport(
          computeMatch(talentInput, scopedCompanyInput),
          talentInput,
          scopedCompanyInput,
          "company",
        );
        matchRoleTitle = originatingRole?.title ?? null;
        matchRoleId = originatingRole?.id ?? null;
      }
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
      matchReport: matchReportForCandidate,
      matchRoleTitle,
      matchRoleId,
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
      <CompanyBoardScreen
        actorId={user.id}
        companyId={companyId}
        candidates={candidatesWithExtras}
      />
    </>
  );
}
