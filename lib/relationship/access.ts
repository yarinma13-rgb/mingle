import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];

export async function requireConnectionAccess(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  userId: string,
): Promise<{ connection: ConnectionRow; otherUserId: string }> {
  const { data: connection } = await supabase
    .from("connections")
    .select("*")
    .eq("id", connectionId)
    .maybeSingle();

  if (
    !connection ||
    connection.status !== "accepted" ||
    (connection.requester_id !== userId && connection.recipient_id !== userId)
  ) {
    notFound();
  }

  const otherUserId =
    connection.requester_id === userId ? connection.recipient_id : connection.requester_id;

  return { connection, otherUserId };
}
