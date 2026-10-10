import { notFound } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { isActiveCompanyMember } from "@/lib/team/persistence";

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

  if (!connection || connection.status !== "accepted") {
    notFound();
  }

  if (connection.requester_id === userId || connection.recipient_id === userId) {
    const otherUserId =
      connection.requester_id === userId
        ? connection.recipient_id
        : connection.requester_id;
    return { connection, otherUserId };
  }

  // Not a literal party — check whether userId is an active teammate on
  // whichever side of the connection is the company workspace, so the
  // whole team shares a connection the way it already shares interviews.
  if (await isActiveCompanyMember(supabase, userId, connection.requester_id)) {
    return { connection, otherUserId: connection.recipient_id };
  }
  if (await isActiveCompanyMember(supabase, userId, connection.recipient_id)) {
    return { connection, otherUserId: connection.requester_id };
  }

  notFound();
}
