import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectionStatus, Database } from "@/lib/supabase/types";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { assertConnectionSendAllowed } from "@/lib/rate-limit";

export type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];

export type SendConnectionResult =
  | { outcome: "sent" }
  | { outcome: "already-pending" }
  | { outcome: "already-connected" }
  | { outcome: "mutual"; connection: ConnectionRow };

/**
 * Sending a connection request when the other person already has a
 * pending request waiting for you accepts theirs instead of creating a
 * second row — this is what makes "whichever side's action completes
 * the match" resolve correctly regardless of who clicks first.
 */
export async function sendOrAcceptConnection(
  supabase: SupabaseClient<Database>,
  fromUserId: string,
  toUserId: string,
): Promise<SendConnectionResult> {
  // A single lookup covering BOTH directions — the unique constraint is
  // per ordered pair, so checking reverse then (separately) forward
  // could find a cancelled/declined reverse row, fall through, and
  // insert a brand new forward row instead of reusing it, leaving two
  // rows for the same pair. Always acting on whichever single row
  // already exists, in either direction, avoids that.
  const { data: existingRow, error: lookupError } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${fromUserId},recipient_id.eq.${toUserId}),and(requester_id.eq.${toUserId},recipient_id.eq.${fromUserId})`,
    )
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existingRow) {
    if (existingRow.status === "accepted") {
      return { outcome: "already-connected" };
    }
    if (existingRow.status === "pending") {
      if (existingRow.requester_id === fromUserId) {
        return { outcome: "already-pending" };
      }
      // The other person's request is waiting for me — this action is
      // the accept, and completes the mutual match.
      const { data: updated, error: updateError } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", existingRow.id)
        .select("*")
        .single();
      if (updateError) throw updateError;
      track(AnalyticsEvent.mingleCreated, { connection_id: updated.id }, fromUserId);
      return { outcome: "mutual", connection: updated };
    }
    // Declined or cancelled — reactivate the same row as a fresh send
    // from whoever is acting now, rather than creating a second row.
    await assertConnectionSendAllowed(supabase, fromUserId);
    const { error: resendError } = await supabase
      .from("connections")
      .update({
        status: "pending",
        requester_id: fromUserId,
        recipient_id: toUserId,
      })
      .eq("id", existingRow.id);
    if (resendError) throw resendError;
    track(AnalyticsEvent.connectionSent, undefined, fromUserId);
    return { outcome: "sent" };
  }

  await assertConnectionSendAllowed(supabase, fromUserId);
  const { error: insertError } = await supabase
    .from("connections")
    .insert({ requester_id: fromUserId, recipient_id: toUserId });
  if (insertError) throw insertError;
  track(AnalyticsEvent.connectionSent, undefined, fromUserId);
  return { outcome: "sent" };
}

export async function acceptConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<ConnectionRow> {
  const { data, error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .select("*")
    .single();
  if (error) throw error;
  track(AnalyticsEvent.mingleCreated, { connection_id: data.id });
  return data;
}

export async function declineConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
) {
  const { error } = await supabase
    .from("connections")
    .update({ status: "declined" })
    .eq("id", connectionId);
  if (error) throw error;
}

export async function loadConnectionStatusWith(
  supabase: SupabaseClient<Database>,
  viewerId: string,
  otherUserId: string,
): Promise<{ status: ConnectionStatus; isRequester: boolean } | null> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(
      `and(requester_id.eq.${viewerId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${viewerId})`,
    )
    .maybeSingle();
  if (error) return null;
  if (!data) return null;
  return { status: data.status, isRequester: data.requester_id === viewerId };
}

export async function loadIncomingPending(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ConnectionRow[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("recipient_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function loadOutgoingPending(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ConnectionRow[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .eq("requester_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function loadAcceptedConnections(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ConnectionRow[]> {
  const { data, error } = await supabase
    .from("connections")
    .select("*")
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .eq("status", "accepted")
    .order("updated_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}
