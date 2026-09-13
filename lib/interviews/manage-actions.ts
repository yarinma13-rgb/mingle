"use server";

import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  googleCalendarConfigured,
  refreshGoogleAccessToken,
  updateGoogleCalendarEvent,
} from "@/lib/calendar/google";
import {
  loadCalendarTokens,
  upsertCalendarConnection,
} from "@/lib/calendar/persistence";
import {
  cancelInterview,
  isMissingInterviewsTable,
  loadInterviewById,
  updateInterviewSchedule,
  type InterviewRecord,
} from "@/lib/interviews/persistence";
import { cancelPendingProposals } from "@/lib/interviews/proposals";
import {
  getOrCreateConversation,
  sendMessage,
} from "@/lib/messaging/persistence";
import { notifyPushToUser } from "@/lib/push/actions";
import { createClient } from "@/lib/supabase/server";
import type { Database, InterviewLocationType } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

type GateOk = {
  ok: true;
  supabase: SupabaseClient<Database>;
  userId: string;
  interview: InterviewRecord;
  otherUserId: string;
};

async function requireConnectionParty(
  interviewId: string,
): Promise<GateOk | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const interview = await loadInterviewById(supabase, interviewId);
  if (!interview || interview.status !== "scheduled") {
    return { ok: false, error: "That interview is no longer scheduled." };
  }

  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .eq("id", interview.connectionId)
    .maybeSingle();
  if (!connection || connection.status !== "accepted") {
    return { ok: false, error: "Connection not available." };
  }
  if (
    user.id !== connection.requester_id &&
    user.id !== connection.recipient_id
  ) {
    return {
      ok: false,
      error: "Only people in this conversation can do that.",
    };
  }

  const otherUserId =
    user.id === connection.requester_id
      ? connection.recipient_id
      : connection.requester_id;

  return {
    ok: true,
    supabase,
    userId: user.id,
    interview,
    otherUserId,
  };
}

async function companyCalendarAuth(
  supabase: SupabaseClient<Database>,
  companyId: string,
) {
  if (!googleCalendarConfigured()) return null;
  const tokens = await loadCalendarTokens(supabase, companyId);
  if (!tokens) return null;

  let accessToken = tokens.accessToken;
  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
  if (!accessToken || expiresAt < Date.now() + 60_000) {
    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken);
    accessToken = refreshed.accessToken;
    await upsertCalendarConnection(supabase, {
      companyId,
      connectedBy: companyId,
      refreshToken: tokens.refreshToken,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
      accountEmail: tokens.accountEmail,
    }).catch(() => undefined);
  }

  return {
    accessToken: accessToken!,
    calendarId: tokens.calendarId,
  };
}

async function postInterviewNote(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  senderId: string,
  body: string,
) {
  try {
    const conversation = await getOrCreateConversation(supabase, connectionId);
    await sendMessage(supabase, conversation.id, senderId, body);
  } catch {
    // Chat note is best-effort.
  }
}

export async function cancelInterviewAction(input: {
  interviewId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const interviewId = input.interviewId?.trim();
  if (!interviewId) return { ok: false, error: "Missing interview." };

  try {
    const gate = await requireConnectionParty(interviewId);
    if (!gate.ok) return gate;
    const { supabase, userId, interview, otherUserId } = gate;

    if (interview.googleEventId) {
      try {
        const auth = await companyCalendarAuth(supabase, interview.companyId);
        if (auth) {
          await deleteGoogleCalendarEvent({
            accessToken: auth.accessToken,
            calendarId: auth.calendarId,
            eventId: interview.googleEventId,
          });
        }
      } catch {
        // Keep DB cancel even if Google delete fails.
      }
    }

    await cancelInterview(supabase, interview.id);
    await cancelPendingProposals(
      supabase,
      interview.connectionId,
      interview.companyId,
    ).catch(() => undefined);

    await postInterviewNote(
      supabase,
      interview.connectionId,
      userId,
      "Interview cancelled.",
    );

    void notifyPushToUser(otherUserId, {
      title: "mingle",
      body: "An interview was cancelled.",
      url: `/conversations/${interview.connectionId}`,
    });

    return { ok: true };
  } catch (error) {
    if (isMissingInterviewsTable(error as { message?: string; code?: string })) {
      return { ok: false, error: "Interviews are not live yet." };
    }
    return { ok: false, error: "Couldn't cancel that interview. Try again." };
  }
}

const rescheduleSchema = z.object({
  interviewId: z.string().uuid(),
  scheduledAt: z.string().min(1),
  durationMinutes: z.number().int().min(15).max(180),
  locationType: z.enum(["video", "in_person"]),
  notes: z.string().trim().max(1000).optional(),
});

export async function rescheduleInterviewAction(input: {
  interviewId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes?: string;
}): Promise<
  { ok: true; meetLink: string | null } | { ok: false; error: string }
> {
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Check the new time.",
    };
  }

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
    return { ok: false, error: "Pick a valid time in the future." };
  }

  try {
    const gate = await requireConnectionParty(parsed.data.interviewId);
    if (!gate.ok) return gate;
    const { supabase, userId, interview, otherUserId } = gate;

    let googleEventId = interview.googleEventId;
    let meetLink = interview.meetLink;

    const auth = await companyCalendarAuth(supabase, interview.companyId);
    if (auth) {
      const [{ data: companyUser }, { data: otherUser }] = await Promise.all([
        supabase
          .from("users")
          .select("email")
          .eq("id", interview.companyId)
          .maybeSingle(),
        supabase
          .from("users")
          .select("email")
          .eq("id", otherUserId)
          .maybeSingle(),
      ]);
      const attendeeEmails = [companyUser?.email, otherUser?.email].filter(
        (value): value is string => Boolean(value),
      );

      try {
        if (googleEventId) {
          const updated = await updateGoogleCalendarEvent({
            accessToken: auth.accessToken,
            calendarId: auth.calendarId,
            eventId: googleEventId,
            summary: "mingle interview",
            description:
              parsed.data.notes?.trim() ||
              interview.notes ||
              "Interview rescheduled on mingle.careers",
            startsAt: when.toISOString(),
            durationMinutes: parsed.data.durationMinutes,
            attendeeEmails,
          });
          googleEventId = updated.eventId;
          meetLink = updated.meetLink ?? meetLink;
        } else {
          const created = await createGoogleCalendarEvent({
            accessToken: auth.accessToken,
            calendarId: auth.calendarId,
            summary: "mingle interview",
            description:
              parsed.data.notes?.trim() ||
              interview.notes ||
              "Interview scheduled on mingle.careers",
            startsAt: when.toISOString(),
            durationMinutes: parsed.data.durationMinutes,
            locationType: parsed.data.locationType,
            attendeeEmails,
          });
          googleEventId = created.eventId;
          meetLink = created.meetLink;
        }
      } catch {
        // Keep DB reschedule if Google update fails.
      }
    }

    await updateInterviewSchedule(supabase, interview.id, {
      scheduledAt: when.toISOString(),
      durationMinutes: parsed.data.durationMinutes,
      locationType: parsed.data.locationType,
      notes:
        parsed.data.notes !== undefined
          ? parsed.data.notes.trim() || null
          : interview.notes,
      googleEventId,
      meetLink,
    });

    await cancelPendingProposals(
      supabase,
      interview.connectionId,
      interview.companyId,
    ).catch(() => undefined);

    await postInterviewNote(
      supabase,
      interview.connectionId,
      userId,
      `Interview rescheduled to ${when.toLocaleString()}.`,
    );

    void notifyPushToUser(otherUserId, {
      title: "mingle",
      body: "An interview was rescheduled.",
      url: `/conversations/${interview.connectionId}`,
    });

    return { ok: true, meetLink };
  } catch (error) {
    if (isMissingInterviewsTable(error as { message?: string; code?: string })) {
      return { ok: false, error: "Interviews are not live yet." };
    }
    return { ok: false, error: "Couldn't reschedule. Try again." };
  }
}
