import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RelationshipStage } from "@/lib/supabase/types";
import type { MessageRow } from "@/lib/messaging/persistence";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export type RelationshipEventRow =
  Database["public"]["Tables"]["relationship_events"]["Row"];

export async function loadTimeline(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<RelationshipEventRow[]> {
  const { data, error } = await supabase
    .from("relationship_events")
    .select("*")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data ?? [];
}

export async function loadTimelinesForConnections(
  supabase: SupabaseClient<Database>,
  connectionIds: string[],
): Promise<Map<string, RelationshipEventRow[]>> {
  const map = new Map<string, RelationshipEventRow[]>();
  for (const id of connectionIds) map.set(id, []);
  if (connectionIds.length === 0) return map;

  const { data, error } = await supabase
    .from("relationship_events")
    .select("*")
    .in("connection_id", connectionIds)
    .order("created_at", { ascending: true });
  if (error || !data) return map;

  for (const row of data) {
    const list = map.get(row.connection_id) ?? [];
    list.push(row);
    map.set(row.connection_id, list);
  }
  return map;
}

async function recordEvent(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  stage: RelationshipStage,
  actorId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase.from("relationship_events").insert({
    connection_id: connectionId,
    stage,
    actor_id: actorId ?? null,
    metadata: metadata ?? {},
  });
  if (error) throw error;
  track(
    AnalyticsEvent.relationshipStage,
    { stage, connection_id: connectionId },
    actorId,
  );
}

export const STAGE_RANK: Record<RelationshipStage, number> = {
  connected: 0,
  exploring: 1,
  in_conversation: 2,
  opportunity: 3,
  decision: 4,
  relationship: 5,
};

/**
 * The furthest stage ever reached, not simply the most recently
 * inserted row — real usage doesn't always progress in the "natural"
 * order (someone might start messaging, reaching in_conversation,
 * before ever visiting the dedicated Explore screen), and the current
 * stage should reflect real progress rather than regress because a
 * lower-ranked event happened to be logged later.
 */
export function currentStage(
  timeline: RelationshipEventRow[],
): RelationshipStage {
  return timeline.reduce<RelationshipStage>(
    (furthest, event) =>
      STAGE_RANK[event.stage] > STAGE_RANK[furthest] ? event.stage : furthest,
    "connected",
  );
}

/** Most recently written stage. Board columns follow this so an explicit, confirmed step back is visible; relationship screens still use currentStage (furthest). */
export function latestStage(
  timeline: RelationshipEventRow[],
): RelationshipStage {
  return timeline[timeline.length - 1]?.stage ?? "connected";
}

export type BoardStageMoveResult =
  | "recorded"
  | "needs_confirmation"
  | "unchanged";

/**
 * Company board drag. Forward (or returning to a column at/below the
 * furthest stage after a confirmed step back) appends via recordEvent.
 * A drop below the furthest stage reached is blocked unless
 * allowRegression is true, matching STAGE_RANK.
 */
export async function recordBoardStage(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  timeline: RelationshipEventRow[],
  target: RelationshipStage,
  actorId: string,
  options?: { allowRegression?: boolean },
): Promise<BoardStageMoveResult> {
  const furthest = currentStage(timeline);
  const displayed = latestStage(timeline);
  if (target === displayed) return "unchanged";
  if (
    STAGE_RANK[target] < STAGE_RANK[furthest] &&
    !options?.allowRegression
  ) {
    return "needs_confirmation";
  }
  await recordEvent(supabase, connectionId, target, actorId, {
    source: "board",
  });
  return "recorded";
}

/**
 * Records a stage event only if it isn't already the furthest stage
 * reached, so re-visiting a screen (or a lazily-triggered check like
 * ensureInConversationEvent) never creates duplicate or out-of-order
 * entries once real progress has already been made. Returns whether
 * an event was actually recorded.
 */
export async function ensureStageAtLeast(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  stage: RelationshipStage,
  timeline: RelationshipEventRow[],
  actorId?: string,
  metadata?: Record<string, unknown>,
): Promise<boolean> {
  if (STAGE_RANK[stage] <= STAGE_RANK[currentStage(timeline)]) return false;
  await recordEvent(supabase, connectionId, stage, actorId, metadata);
  return true;
}

/**
 * Ensures a connection has at least a "connected" event — called
 * lazily wherever the timeline is read, so connections accepted
 * before this table existed still get a real first event instead of
 * silently having no history.
 */
export async function ensureConnectedEvent(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  timeline: RelationshipEventRow[],
): Promise<boolean> {
  if (timeline.length > 0) return false;
  await recordEvent(supabase, connectionId, "connected");
  return true;
}

/**
 * Advances to "in_conversation" once both sides have actually sent a
 * message — a real behavioral signal, not a manual click — logged as
 * a genuine timestamped event rather than recomputed live the way
 * Phase 7's heuristic did.
 */
export async function ensureInConversationEvent(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  timeline: RelationshipEventRow[],
  messages: Pick<MessageRow, "sender_id">[],
  requesterId: string,
  recipientId: string,
): Promise<boolean> {
  const requesterSent = messages.some((m) => m.sender_id === requesterId);
  const recipientSent = messages.some((m) => m.sender_id === recipientId);
  if (!requesterSent || !recipientSent) return false;
  return ensureStageAtLeast(supabase, connectionId, "in_conversation", timeline);
}

export type OpportunityDetails = { role: string; context: string };

/**
 * Records the opportunity — a one-time, explicit action (only ever
 * moves the stage forward, per ensureStageAtLeast), carrying the role
 * and context in the event's own metadata rather than a separate
 * opportunities table, which would be more structure than a single
 * free-text role and context per connection actually needs right now.
 */
export async function createOpportunity(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  timeline: RelationshipEventRow[],
  actorId: string,
  details: OpportunityDetails,
): Promise<boolean> {
  return ensureStageAtLeast(
    supabase,
    connectionId,
    "opportunity",
    timeline,
    actorId,
    details,
  );
}

export type DecisionChoice =
  | "move_forward"
  | "keep_relationship"
  | "not_right_fit"
  | "stay_connected";

const POSITIVE_DECISIONS: DecisionChoice[] = ["move_forward", "keep_relationship"];

/**
 * Records a decision. Always logs a "decision" event (even if the
 * connection somehow already reached that stage, since a decision is
 * a distinct real moment, not just a stage marker) — a positive
 * choice additionally logs a "relationship" event right after, since
 * PRODUCT_SPEC.md's timeline treats that as the pipeline's ongoing
 * state once both sides choose to continue.
 */
export async function recordDecision(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  actorId: string,
  choice: DecisionChoice,
): Promise<void> {
  await recordEvent(supabase, connectionId, "decision", actorId, { choice });
  if (POSITIVE_DECISIONS.includes(choice)) {
    await recordEvent(supabase, connectionId, "relationship", actorId, { choice });
  }
}
