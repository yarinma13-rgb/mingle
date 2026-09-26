import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CollaboratorTone = "positive" | "neutral" | "concern";

export type MatchCollaboratorRow = {
  id: string;
  connectionId: string;
  invitedUserId: string;
  invitedBy: string;
  tone: CollaboratorTone | null;
  comment: string | null;
  respondedAt: string | null;
  createdAt: string;
};

export function isMissingMatchCollaboratorsTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("match_collaborators") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

function toRow(
  row: Database["public"]["Tables"]["match_collaborators"]["Row"],
): MatchCollaboratorRow {
  return {
    id: row.id,
    connectionId: row.connection_id,
    invitedUserId: row.invited_user_id,
    invitedBy: row.invited_by,
    tone: row.tone as CollaboratorTone | null,
    comment: row.comment,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
  };
}

export async function loadCollaboratorsForConnection(
  supabase: SupabaseClient<Database>,
  connectionId: string,
): Promise<MatchCollaboratorRow[]> {
  const { data, error } = await supabase
    .from("match_collaborators")
    .select("*")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: true });
  if (error) {
    if (isMissingMatchCollaboratorsTable(error)) return [];
    throw error;
  }
  return (data ?? []).map(toRow);
}

export async function inviteCollaborator(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    companyId: string;
    invitedUserId: string;
    invitedBy: string;
  },
): Promise<void> {
  const { data: existing } = await supabase
    .from("match_collaborators")
    .select("id")
    .eq("connection_id", input.connectionId)
    .eq("invited_user_id", input.invitedUserId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase.from("match_collaborators").insert({
    connection_id: input.connectionId,
    company_id: input.companyId,
    invited_user_id: input.invitedUserId,
    invited_by: input.invitedBy,
  });
  if (error) throw error;
}

export async function submitCollaboratorFeedback(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    companyId: string;
    authorId: string;
    tone: CollaboratorTone;
    comment: string;
  },
): Promise<void> {
  const { data: existing } = await supabase
    .from("match_collaborators")
    .select("id")
    .eq("connection_id", input.connectionId)
    .eq("invited_user_id", input.authorId)
    .maybeSingle();

  const patch = {
    tone: input.tone,
    comment: input.comment.trim() || null,
    responded_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("match_collaborators")
      .update(patch)
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("match_collaborators").insert({
    connection_id: input.connectionId,
    company_id: input.companyId,
    invited_user_id: input.authorId,
    invited_by: input.authorId,
    ...patch,
  });
  if (error) throw error;
}
