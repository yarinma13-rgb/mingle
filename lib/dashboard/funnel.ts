import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RelationshipStage } from "@/lib/supabase/types";
import { loadAcceptedConnections } from "@/lib/connections/persistence";
import { loadTimelinesForConnections } from "@/lib/relationship/persistence";

export const FUNNEL_STAGES: { id: RelationshipStage; label: string }[] = [
  { id: "connected", label: "Connected" },
  { id: "exploring", label: "Exploring" },
  { id: "in_conversation", label: "In conversation" },
  { id: "interview_booked", label: "Interview booked" },
  { id: "opportunity", label: "Opportunity" },
  { id: "decision", label: "Decision" },
  { id: "relationship", label: "Relationship" },
];

/** One color per stage, shared by the funnel bars and the donut so the two views read as one system. */
export const FUNNEL_STAGE_COLORS: Record<RelationshipStage, string> = {
  connected: "var(--mingle-accent-pink)",
  exploring: "var(--mingle-accent-magenta)",
  in_conversation: "var(--mingle-accent-purple)",
  interview_booked: "var(--mingle-accent-violet)",
  opportunity: "var(--mingle-accent-blue)",
  decision: "var(--mingle-warning)",
  relationship: "var(--mingle-success)",
};

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
    interview_booked: 0,
    opportunity: 0,
    decision: 0,
    relationship: 0,
  };
}

export function funnelFromStages(
  stages: Array<RelationshipStage | undefined>,
): CompanyFunnel {
  const counts = emptyCounts();
  for (const stage of stages) {
    counts[stage ?? "connected"] += 1;
  }
  return { counts, total: stages.length };
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

export type TimeToHire = { averageDays: number | null; sampleSize: number };

/**
 * Average days from a connection's first "connected" event to its first
 * "decision" or "relationship" event, whichever comes first — only
 * connections that actually reached a decision count toward the average,
 * so an early-stage pipeline doesn't drag the number down artificially.
 */
export async function loadAverageTimeToHireDays(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TimeToHire> {
  const accepted = await loadAcceptedConnections(supabase, userId);
  if (accepted.length === 0) return { averageDays: null, sampleSize: 0 };

  const ids = accepted.map((row) => row.id);
  const timelines = await loadTimelinesForConnections(supabase, ids);

  const durations: number[] = [];
  for (const id of ids) {
    const timeline = timelines.get(id) ?? [];
    if (timeline.length === 0) continue;
    const connectedEvent = timeline.find((event) => event.stage === "connected");
    const connectedAt = new Date(
      connectedEvent ? connectedEvent.created_at : timeline[0].created_at,
    ).getTime();
    const decidedEvent = timeline.find(
      (event) => event.stage === "decision" || event.stage === "relationship",
    );
    if (!decidedEvent) continue;
    const days =
      (new Date(decidedEvent.created_at).getTime() - connectedAt) / 86_400_000;
    if (days >= 0) durations.push(days);
  }

  if (durations.length === 0) return { averageDays: null, sampleSize: 0 };
  const averageDays =
    durations.reduce((sum, days) => sum + days, 0) / durations.length;
  return { averageDays, sampleSize: durations.length };
}
