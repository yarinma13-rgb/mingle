import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type CandidateNoteRow = {
  connectionId: string;
  notes: string;
  tags: string[];
  updatedBy: string | null;
  updatedAt: string;
};

export function isMissingCandidateNotesTable(
  error: { message?: string; code?: string } | null,
) {
  if (!error) return false;
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("candidate_notes") &&
      (message.includes("does not exist") ||
        message.includes("schema cache") ||
        message.includes("could not find")))
  );
}

export async function loadNotesForConnections(
  supabase: SupabaseClient<Database>,
  connectionIds: string[],
): Promise<Map<string, CandidateNoteRow>> {
  if (connectionIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("candidate_notes")
    .select("connection_id, notes, tags, updated_by, updated_at")
    .in("connection_id", connectionIds);
  if (error || !data) return new Map();
  return new Map(
    data.map((row) => [
      row.connection_id,
      {
        connectionId: row.connection_id,
        notes: row.notes,
        tags: row.tags ?? [],
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      },
    ]),
  );
}

export async function saveCandidateNote(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    companyId: string;
    notes: string;
    tags: string[];
    updatedBy: string;
  },
): Promise<void> {
  const { error } = await supabase.from("candidate_notes").upsert(
    {
      connection_id: input.connectionId,
      company_id: input.companyId,
      notes: input.notes,
      tags: input.tags,
      updated_by: input.updatedBy,
    },
    { onConflict: "connection_id" },
  );
  if (error) throw error;
}
