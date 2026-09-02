import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RelationshipStage } from "@/lib/supabase/types";
import { loadAcceptedConnections } from "@/lib/connections/persistence";

export const FUNNEL_STAGES: { id: RelationshipStage; label: string }[] = [
  { id: "connected", label: "Connected" },
  { id: "exploring", label: "Exploring" },
  { id: "in_conversation", label: "In conversation" },
  { id: "opportunity", label: "Opportunity" },
  { id: "decision", label: "Decision" },
  { id: "relationship", label: "Relationship" },
];

export type FunnelCounts = Record<RelationshipStage, number>;

export type CompanyFunnel = {
  counts: FunnelCounts;
  total: number;
};

function emptyCounts(): FunnelCounts {
  return {
    connected: 0,
    exploring: 0,
    in_conversation: 0,
    opportunity: 0,
    decision: 0,
    relationship: 0,
  };
}

/**
 * Snapshot of where each accepted connection sits, using the latest
 * relationship_events row (same display rule as the Board columns).
 * Connections with no events yet count as Connected. Read-only.
 */
export async function loadCompanyFunnel(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CompanyFunnel> {
  const counts = emptyCounts();
  const accepted = await loadAcceptedConnections(supabase, userId);
  const total = accepted.length;
  if (total === 0) return { counts, total };

  const ids = accepted.map((row) => row.id);
  const latest = new Map<string, RelationshipStage>();
  for (const id of ids) latest.set(id, "connected");

  const { data, error } = await supabase
    .from("relationship_events")
    .select("connection_id, stage, created_at")
    .in("connection_id", ids)
    .order("created_at", { ascending: true });

  if (!error && data) {
    for (const event of data) {
      latest.set(event.connection_id, event.stage);
    }
  }

  for (const stage of latest.values()) {
    counts[stage] += 1;
  }
  return { counts, total };
}
