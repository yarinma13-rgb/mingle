import type { RelationshipEventRow } from "@/lib/relationship/persistence";
import type { RoleRecord } from "@/lib/roles/persistence";

/**
 * Best-effort: connections/interviews aren't linked to a role by id, only
 * by the free-text role name recorded on the "opportunity" timeline event
 * (see lib/relationship/persistence.ts createOpportunity). Returns null
 * (score/attribute against the general company profile instead of
 * guessing) when no title match is found. Shared by board/page.tsx and
 * interviews/page.tsx so both attribute to a role the same way.
 */
export function findOriginatingRole(
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
