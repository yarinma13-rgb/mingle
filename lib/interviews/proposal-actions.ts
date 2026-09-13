"use server";

import {
  createGoogleCalendarEvent,
  googleCalendarConfigured,
  refreshGoogleAccessToken,
} from "@/lib/calendar/google";
import {
  deleteCalendarConnection,
  loadCalendarConnection,
  loadCalendarTokens,
  upsertCalendarConnection,
} from "@/lib/calendar/persistence";
import {
  cancelPendingProposals,
  createInterviewProposal,
  isMissingProposalsTable,
  loadPendingProposalForConnection,
} from "@/lib/interviews/proposals";
import { notifyPushToUser } from "@/lib/push/actions";
import { createClient } from "@/lib/supabase/server";
import type { InterviewLocationType } from "@/lib/supabase/types";
import { z } from "zod";

const proposeSchema = z.object({
  connectionId: z.string().uuid(),
  companyId: z.string().uuid(),
  durationMinutes: z.number().int().min(15).max(180),
  locationType: z.enum(["video", "in_person"]),
  notes: z.string().trim().max(1000),
  slotStartsAt: z.array(z.string().min(1)).min(2).max(3),
});

type BookedRow = {
  interview_id: string;
  company_id: string;
  connection_id: string;
  scheduled_at: string;
  duration_minutes: number;
  location_type: InterviewLocationType;
  notes: string | null;
  talent_user_id: string;
};

type TokenRow = {
  refresh_token: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  calendar_id: string;
  account_email: string | null;
};

async function ensureCompanyOnConnection(
  companyId: string,
  connectionId: string,
  userId: string,
) {
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", userId)
    .maybeSingle();
  if (account?.user_type !== "company") {
    return { ok: false as const, error: "Only the company side can do that." };
  }
  if (userId !== companyId) {
    return {
      ok: false as const,
      error: "Use the company account for calendar scheduling for now.",
    };
  }
  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .eq("id", connectionId)
    .maybeSingle();
  if (!connection || connection.status !== "accepted") {
    return { ok: false as const, error: "Connect first, then propose times." };
  }
  if (
    connection.requester_id !== companyId &&
    connection.recipient_id !== companyId
  ) {
    return {
      ok: false as const,
      error: "That conversation is not on this workspace.",
    };
  }
  const talentId =
    connection.requester_id === companyId
      ? connection.recipient_id
      : connection.requester_id;
  return { ok: true as const, supabase, talentId };
}

export async function proposeInterviewSlotsAction(input: {
  connectionId: string;
  companyId: string;
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes: string;
  slotStartsAt: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = proposeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Pick 2–3 future times.",
    };
  }

  const starts = parsed.data.slotStartsAt.map((value) => new Date(value));
  if (
    starts.some(
      (date) => Number.isNaN(date.getTime()) || date.getTime() <= Date.now(),
    )
  ) {
    return { ok: false, error: "Each slot must be a valid time in the future." };
  }
  const unique = new Set(starts.map((date) => date.toISOString()));
  if (unique.size !== starts.length) {
    return { ok: false, error: "Pick distinct time slots." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to propose interview times." };

  const gate = await ensureCompanyOnConnection(
    parsed.data.companyId,
    parsed.data.connectionId,
    user.id,
  );
  if (!gate.ok) return gate;

  try {
    await cancelPendingProposals(
      gate.supabase,
      parsed.data.connectionId,
      parsed.data.companyId,
    );
    await createInterviewProposal(gate.supabase, {
      companyId: parsed.data.companyId,
      connectionId: parsed.data.connectionId,
      proposedBy: user.id,
      durationMinutes: parsed.data.durationMinutes,
      locationType: parsed.data.locationType,
      notes: parsed.data.notes,
      slotStartsAt: starts.map((date) => date.toISOString()),
    });

    void notifyPushToUser(gate.talentId, {
      title: "mingle",
      body: "A company proposed interview times. Pick a slot that works.",
      url: `/conversations/${parsed.data.connectionId}`,
    });

    return { ok: true };
  } catch (error) {
    if (isMissingProposalsTable(error as { message?: string; code?: string })) {
      return {
        ok: false,
        error:
          "Interview proposals are not live yet. Ask the founder to run migration 0029.",
      };
    }
    return { ok: false, error: "Couldn't save those times. Try again." };
  }
}

export async function acceptInterviewSlotAction(input: {
  slotId: string;
}): Promise<
  | { ok: true; meetLink: string | null; scheduledAt: string }
  | { ok: false; error: string }
> {
  const slotId = input.slotId?.trim();
  if (!slotId) return { ok: false, error: "Pick a time slot." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to accept an interview time." };

  const { data: slotRow } = await supabase
    .from("interview_proposal_slots")
    .select("id, proposal_id, starts_at")
    .eq("id", slotId)
    .maybeSingle();
  if (!slotRow) return { ok: false, error: "That slot is no longer available." };

  let calendarTokens: TokenRow | null = null;
  try {
    const { data } = await supabase.rpc(
      "calendar_tokens_for_pending_proposal",
      { p_proposal_id: slotRow.proposal_id },
    );
    const rows = data as TokenRow[] | TokenRow | null;
    calendarTokens = Array.isArray(rows) ? (rows[0] ?? null) : rows;
  } catch {
    calendarTokens = null;
  }

  const { data: booked, error: bookError } = await supabase.rpc(
    "book_interview_from_slot",
    { p_slot_id: slotId },
  );
  if (bookError || !booked) {
    const message = (bookError?.message ?? "").toLowerCase();
    if (
      message.includes("book_interview_from_slot") ||
      message.includes("schema cache") ||
      message.includes("could not find")
    ) {
      return {
        ok: false,
        error:
          "Interview booking is not live yet. Ask the founder to run migration 0029.",
      };
    }
    return {
      ok: false,
      error: bookError?.message || "Couldn't book that slot. Try another time.",
    };
  }

  const row = (Array.isArray(booked) ? booked[0] : booked) as BookedRow | null;
  if (!row?.interview_id) {
    return { ok: false, error: "Couldn't book that slot. Try another time." };
  }

  let meetLink: string | null = null;
  if (googleCalendarConfigured() && calendarTokens?.refresh_token) {
    try {
      let accessToken = calendarTokens.access_token;
      const expiresAt = calendarTokens.access_token_expires_at
        ? new Date(calendarTokens.access_token_expires_at).getTime()
        : 0;
      if (!accessToken || expiresAt < Date.now() + 60_000) {
        const refreshed = await refreshGoogleAccessToken(
          calendarTokens.refresh_token,
        );
        accessToken = refreshed.accessToken;
        await upsertCalendarConnection(supabase, {
          companyId: row.company_id,
          connectedBy: row.company_id,
          refreshToken: calendarTokens.refresh_token,
          accessToken: refreshed.accessToken,
          expiresAt: refreshed.expiresAt,
          accountEmail: calendarTokens.account_email,
        }).catch(() => undefined);
      }

      const [{ data: companyUser }, { data: talentUser }] = await Promise.all([
        supabase
          .from("users")
          .select("email")
          .eq("id", row.company_id)
          .maybeSingle(),
        supabase
          .from("users")
          .select("email")
          .eq("id", row.talent_user_id)
          .maybeSingle(),
      ]);

      const event = await createGoogleCalendarEvent({
        accessToken: accessToken!,
        calendarId: calendarTokens.calendar_id,
        summary: "mingle interview",
        description:
          row.notes?.trim() || "Interview scheduled on mingle.careers",
        startsAt: row.scheduled_at,
        durationMinutes: row.duration_minutes,
        locationType: row.location_type,
        attendeeEmails: [companyUser?.email, talentUser?.email].filter(
          (value): value is string => Boolean(value),
        ),
      });
      meetLink = event.meetLink;
      await supabase
        .from("interviews")
        .update({
          google_event_id: event.eventId,
          meet_link: event.meetLink,
        })
        .eq("id", row.interview_id);
    } catch {
      // Interview stays booked even if Google Calendar fails.
    }
  }

  void notifyPushToUser(row.company_id, {
    title: "mingle",
    body: "Interview booked — the candidate picked a time.",
    url: `/conversations/${row.connection_id}`,
  });

  return {
    ok: true,
    meetLink,
    scheduledAt: row.scheduled_at,
  };
}

export async function disconnectGoogleCalendarAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in first." };
  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "company") {
    return { ok: false, error: "Only company accounts connect a calendar." };
  }
  try {
    await deleteCalendarConnection(supabase, user.id);
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't disconnect. Try again." };
  }
}

export async function loadCompanyCalendarStatusAction(): Promise<{
  configured: boolean;
  connected: boolean;
  accountEmail: string | null;
}> {
  const configured = googleCalendarConfigured();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { configured, connected: false, accountEmail: null };
  try {
    const connection = await loadCalendarConnection(supabase, user.id);
    return {
      configured,
      connected: Boolean(connection),
      accountEmail: connection?.accountEmail ?? null,
    };
  } catch {
    return { configured, connected: false, accountEmail: null };
  }
}

export async function loadPendingProposalAction(connectionId: string) {
  const supabase = await createClient();
  return loadPendingProposalForConnection(supabase, connectionId);
}

export async function syncInterviewToGoogleCalendar(input: {
  interviewId: string;
  companyId: string;
  scheduledAt: string;
  durationMinutes: number;
  locationType: InterviewLocationType;
  notes: string | null;
  talentUserId: string;
}): Promise<string | null> {
  if (!googleCalendarConfigured()) return null;
  const supabase = await createClient();
  const tokens = await loadCalendarTokens(supabase, input.companyId);
  if (!tokens) return null;

  let accessToken = tokens.accessToken;
  const expiresAt = tokens.expiresAt ? new Date(tokens.expiresAt).getTime() : 0;
  if (!accessToken || expiresAt < Date.now() + 60_000) {
    const refreshed = await refreshGoogleAccessToken(tokens.refreshToken);
    accessToken = refreshed.accessToken;
    await upsertCalendarConnection(supabase, {
      companyId: input.companyId,
      connectedBy: input.companyId,
      refreshToken: tokens.refreshToken,
      accessToken: refreshed.accessToken,
      expiresAt: refreshed.expiresAt,
      accountEmail: tokens.accountEmail,
    });
  }

  const [{ data: companyUser }, { data: talentUser }] = await Promise.all([
    supabase.from("users").select("email").eq("id", input.companyId).maybeSingle(),
    supabase
      .from("users")
      .select("email")
      .eq("id", input.talentUserId)
      .maybeSingle(),
  ]);

  const event = await createGoogleCalendarEvent({
    accessToken,
    calendarId: tokens.calendarId,
    summary: "mingle interview",
    description: input.notes?.trim() || "Interview scheduled on mingle.careers",
    startsAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
    locationType: input.locationType,
    attendeeEmails: [companyUser?.email, talentUser?.email].filter(
      (value): value is string => Boolean(value),
    ),
  });

  await supabase
    .from("interviews")
    .update({
      google_event_id: event.eventId,
      meet_link: event.meetLink,
    })
    .eq("id", input.interviewId);

  return event.meetLink;
}
