"use server";

import { createClient } from "@/lib/supabase/server";
import {
  isMissingInterviewsTable,
  scheduleInterview,
} from "@/lib/interviews/persistence";
import type { InterviewLocationType } from "@/lib/supabase/types";
import { z } from "zod";

const schema = z.object({
  connectionId: z.string().uuid(),
  companyId: z.string().uuid(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(180),
  locationType: z.enum(["video", "in_person"]),
  notes: z.string().trim().max(1000),
});

export async function scheduleInterviewAction(input: {
  connectionId: string;
  companyId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, error: "Pick a valid date and time." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to schedule an interview." };

  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "company") {
    return { ok: false, error: "Only the company side can schedule." };
  }

  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .eq("id", parsed.data.connectionId)
    .maybeSingle();
  if (!connection || connection.status !== "accepted") {
    return { ok: false, error: "Connect first, then schedule." };
  }
  if (
    connection.requester_id !== parsed.data.companyId &&
    connection.recipient_id !== parsed.data.companyId
  ) {
    return { ok: false, error: "That conversation is not on this workspace." };
  }
  if (user.id !== parsed.data.companyId) {
    return { ok: false, error: "Schedule from the company account for now." };
  }

  try {
    await scheduleInterview(supabase, {
      companyId: parsed.data.companyId,
      connectionId: parsed.data.connectionId,
      scheduledBy: user.id,
      scheduledAt: when.toISOString(),
      durationMinutes: parsed.data.durationMinutes,
      locationType: parsed.data.locationType,
      notes: parsed.data.notes,
    });
    return { ok: true };
  } catch (error) {
    if (isMissingInterviewsTable(error as { message?: string; code?: string })) {
      return {
        ok: false,
        error: "Interviews are not live yet. Ask the founder to run the SQL migration.",
      };
    }
    return { ok: false, error: "Couldn't save that. Try again in a moment." };
  }
}
