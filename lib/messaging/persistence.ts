import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { assertMessageSendAllowed } from "@/lib/rate-limit";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export async function getOrCreateConversation(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<ConversationRow> {
  const { data: existing, error: lookupError } = await supabase
    .from("conversations")
    .select("*")
    .eq("connection_id", connectionId)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({ connection_id: connectionId })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function loadMessages(
  supabase: SupabaseClient<Database>,
  conversationId: string,
): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendMessage(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  senderId: string,
  body: string,
): Promise<MessageRow> {
  await assertMessageSendAllowed(supabase, senderId);
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("*")
    .single();
  if (error) throw error;
  track(AnalyticsEvent.messageSent, { conversation_id: conversationId }, senderId);
  return data;
}

export async function markConversationRead(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  viewerId: string,
) {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("read_at", null);
  if (error) throw error;
}

export function subscribeToConversation(
  supabase: SupabaseClient<Database>,
  conversationId: string,
  onInsert: (message: MessageRow) => void,
) {
  const channel = supabase
    .channel(`conversation-${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onInsert(payload.new as MessageRow),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
