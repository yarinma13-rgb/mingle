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
    const interview = await scheduleInterview(supabase, {
      companyId: parsed.data.companyId,
      connectionId: parsed.data.connectionId,
      scheduledBy: user.id,
      scheduledAt: when.toISOString(),
      durationMinutes: parsed.data.durationMinutes,
      locationType: parsed.data.locationType,
      notes: parsed.data.notes,
    });

    try {
      const { loadTimeline, ensureStageAtLeast } = await import(
        "@/lib/relationship/persistence"
      );
      const timeline = await loadTimeline(supabase, parsed.data.connectionId);
      await ensureStageAtLeast(
        supabase,
        parsed.data.connectionId,
        "interview_booked",
        timeline,
        user.id,
        {
          interview_id: interview.id,
          scheduled_at: interview.scheduledAt,
        },
      );
    } catch {
      // Relationship timeline may not be migrated yet.
    }

    const talentUserId =
      connection.requester_id === parsed.data.companyId
        ? connection.recipient_id
        : connection.requester_id;
    try {
      const { syncInterviewToGoogleCalendar } = await import(
        "@/lib/interviews/proposal-actions"
      );
      await syncInterviewToGoogleCalendar({
        interviewId: interview.id,
        companyId: parsed.data.companyId,
        scheduledAt: interview.scheduledAt,
        durationMinutes: interview.durationMinutes,
        locationType: interview.locationType,
        notes: interview.notes,
        talentUserId,
      });
    } catch {
      // Calendar sync is best-effort.
    }

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
