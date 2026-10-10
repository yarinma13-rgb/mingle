"use server";

import { createClient } from "@/lib/supabase/server";
import {
  saveCandidateNote,
  isMissingCandidateNotesTable,
} from "@/lib/notes/persistence";
import { isActiveCompanyMember } from "@/lib/team/persistence";
import { z } from "zod";

const schema = z.object({
  connectionId: z.string().uuid(),
  notes: z.string().trim().max(2000),
  tags: z.array(z.string().trim().min(1).max(30)).max(10),
});

export async function saveCandidateNoteAction(input: {
  connectionId: string;
  notes: string;
  tags: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the note.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id")
    .eq("id", parsed.data.connectionId)
    .maybeSingle();
  if (!connection) return { ok: false, error: "Connection not found." };

  const companyId = (await isActiveCompanyMember(
    supabase,
    user.id,
    connection.requester_id,
  ))
    ? connection.requester_id
    : (await isActiveCompanyMember(supabase, user.id, connection.recipient_id))
      ? connection.recipient_id
      : null;
  if (!companyId) {
    return { ok: false, error: "Only the company team can add notes." };
  }

  try {
    await saveCandidateNote(supabase, {
      connectionId: parsed.data.connectionId,
      companyId,
      notes: parsed.data.notes,
      tags: parsed.data.tags,
      updatedBy: user.id,
    });
    return { ok: true };
  } catch (error) {
    if (
      isMissingCandidateNotesTable(
        error as { message?: string; code?: string },
      )
    ) {
      return { ok: false, error: "Notes aren't available yet. Try again later." };
    }
    return { ok: false, error: "Couldn't save that note. Try again." };
  }
}
