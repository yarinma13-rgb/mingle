import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadAcceptedConnections } from "@/lib/connections/persistence";

export type KpiTrend = {
  /** Percent change vs prior week. Null means hide the indicator. */
  percent: number | null;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function inRange(iso: string, start: number, end: number): boolean {
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}

/**
 * Week-over-week deltas from existing relationship_events + match_feedback.
 * No snapshot table. Hide when the prior week has nothing to compare.
 */
export async function loadCompanyKpiTrends(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{
  connections: KpiTrend;
  conversations: KpiTrend;
  opportunities: KpiTrend;
}> {
  const now = Date.now();
  const thisWeekStart = now - WEEK_MS;
  const prevWeekStart = now - 2 * WEEK_MS;

  const accepted = await loadAcceptedConnections(supabase, userId);
  const connectionIds = accepted.map((row) => row.id);

  let events: { stage: string; created_at: string }[] = [];
  if (connectionIds.length > 0) {
    const { data, error } = await supabase
      .from("relationship_events")
      .select("stage, created_at")
      .in("connection_id", connectionIds)
      .gte("created_at", new Date(prevWeekStart).toISOString());
    if (!error && data) events = data;
  }

  const countStage = (stage: string, start: number, end: number) =>
    events.filter(
      (event) => event.stage === stage && inRange(event.created_at, start, end),
    ).length;

  const newConnectionsThis = accepted.filter((row) =>
    inRange(row.created_at, thisWeekStart, now),
  ).length;
  const newConnectionsPrev = accepted.filter((row) =>
    inRange(row.created_at, prevWeekStart, thisWeekStart),
  ).length;

  return {
    connections: {
      percent: percentChange(newConnectionsThis, newConnectionsPrev),
    },
    conversations: {
      percent: percentChange(
        countStage("in_conversation", thisWeekStart, now),
        countStage("in_conversation", prevWeekStart, thisWeekStart),
      ),
    },
    opportunities: {
      percent: percentChange(
        countStage("opportunity", thisWeekStart, now),
        countStage("opportunity", prevWeekStart, thisWeekStart),
      ),
    },
  };
}

export async function loadTalentKpiTrends(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{
  connections: KpiTrend;
  conversations: KpiTrend;
}> {
  const company = await loadCompanyKpiTrends(supabase, userId);
  return {
    connections: company.connections,
    conversations: company.conversations,
  };
}
