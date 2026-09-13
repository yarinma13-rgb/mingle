"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleInterviewAction } from "@/lib/interviews/actions";
import {
  acceptInterviewSlotAction,
  disconnectGoogleCalendarAction,
  loadCompanyCalendarStatusAction,
  proposeInterviewSlotsAction,
} from "@/lib/interviews/proposal-actions";
import type { InterviewRecord } from "@/lib/interviews/persistence";
import type { InterviewProposal } from "@/lib/interviews/proposals";
import { useToast } from "@/components/toast/ToastProvider";

function formatInterviewWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleInterviewControls({
  connectionId,
  companyId,
  upcoming,
  calendarConnected = false,
}: {
  connectionId: string;
  companyId: string;
  upcoming: InterviewRecord | null;
  calendarConnected?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"propose" | "direct">("propose");
  const defaults = useMemo(() => {
    const a = new Date();
    a.setMinutes(0, 0, 0);
    a.setHours(a.getHours() + 24);
    return {
      a: toLocalInput(a),
      b: toLocalInput(new Date(a.getTime() + 86400000)),
      c: toLocalInput(new Date(a.getTime() + 172800000)),
    };
  }, []);
  const [slotA, setSlotA] = useState("");
  const [slotB, setSlotB] = useState("");
  const [slotC, setSlotC] = useState("");
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<"video" | "in_person">("video");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitPropose = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const slots = [slotA || defaults.a, slotB || defaults.b, slotC || defaults.c].map(
      (value) => new Date(value).toISOString(),
    );
    const result = await proposeInterviewSlotsAction({
      connectionId,
      companyId,
      durationMinutes: duration,
      locationType,
      notes,
      slotStartsAt: slots,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast("Time slots sent.");
    setOpen(false);
    router.refresh();
  };

  const submitDirect = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await scheduleInterviewAction({
      connectionId,
      companyId,
      scheduledAt: when,
      durationMinutes: duration,
      locationType,
      notes,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(
      calendarConnected
        ? "Interview booked + calendar synced."
        : "Interview booked.",
    );
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {upcoming ? (
        <p className="max-w-[14rem] text-right text-xs text-mingle-text-secondary">
          Next: {formatInterviewWhen(upcoming.scheduledAt)} ·{" "}
          {upcoming.durationMinutes} min
          {upcoming.meetLink ? " · Meet ready" : ""}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-mingle-surface px-3 py-1.5 text-xs font-semibold text-mingle-text hover:bg-mingle-surface/70"
      >
        {upcoming ? "Reschedule" : "Propose times"}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-mingle-text">
              Book an interview
            </h2>
            <p className="mt-2 text-sm text-mingle-text-secondary">
              {calendarConnected
                ? "Propose slots or book one time. Google Calendar syncs on confirm."
                : "Propose 2–3 slots. Connect Google Calendar in Settings for Meet links."}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("propose")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  mode === "propose"
                    ? "bg-mingle-cta text-white"
                    : "bg-mingle-bg text-mingle-text-secondary"
                }`}
              >
                Propose slots
              </button>
              <button
                type="button"
                onClick={() => setMode("direct")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  mode === "direct"
                    ? "bg-mingle-cta text-white"
                    : "bg-mingle-bg text-mingle-text-secondary"
                }`}
              >
                Pick one time
              </button>
            </div>
            {mode === "propose" ? (
              <div className="mt-4 space-y-3">
                {(
                  [
                    ["Slot 1", slotA, setSlotA, defaults.a],
                    ["Slot 2", slotB, setSlotB, defaults.b],
                    ["Slot 3", slotC, setSlotC, defaults.c],
                  ] as const
                ).map(([label, value, setter, fallback]) => (
                  <label
                    key={label}
                    className="block text-sm font-medium text-mingle-text"
                  >
                    {label}
                    <input
                      type="datetime-local"
                      value={value || fallback}
                      onChange={(event) => setter(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm outline-none focus:border-mingle-pink"
                    />
                  </label>
                ))}
              </div>
            ) : (
              <label className="mt-4 block text-sm font-medium text-mingle-text">
                Date and time
                <input
                  type="datetime-local"
                  value={when}
                  onChange={(event) => setWhen(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm outline-none focus:border-mingle-pink"
                />
              </label>
            )}
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Duration
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm outline-none focus:border-mingle-pink"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <div className="mt-4 flex gap-2">
              {(["video", "in_person"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLocationType(type)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    locationType === type
                      ? "bg-mingle-cta text-white"
                      : "bg-mingle-bg text-mingle-text-secondary"
                  }`}
                >
                  {type === "video" ? "Video" : "In person"}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Note
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm outline-none focus:border-mingle-pink"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-mingle-pink">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-mingle-bg px-5 py-2.5 text-sm font-semibold text-mingle-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || (mode === "direct" && !when)}
                onClick={() =>
                  void (mode === "propose" ? submitPropose() : submitDirect())
                }
                className="rounded-full bg-mingle-cta px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : mode === "propose" ? "Send slots" : "Book now"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AcceptInterviewSlots({
  proposal,
}: {
  proposal: InterviewProposal;
}) {
  const toast = useToast();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const offered = proposal.slots.filter((slot) => slot.status === "offered");
  if (offered.length === 0) return null;

  return (
    <div className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-3">
      <p className="text-sm font-semibold text-mingle-text">Pick an interview time</p>
      <p className="mt-1 text-xs text-mingle-text-secondary">
        {proposal.durationMinutes} min ·{" "}
        {proposal.locationType === "video" ? "Video" : "In person"}
      </p>
      <ul className="mt-3 space-y-2">
        {offered.map((slot) => (
          <li key={slot.id} className="flex items-center justify-between gap-3">
            <span className="text-sm text-mingle-text">
              {formatInterviewWhen(slot.startsAt)}
            </span>
            <button
              type="button"
              disabled={busyId === slot.id}
              onClick={() => {
                void (async () => {
                  setBusyId(slot.id);
                  setError(null);
                  const result = await acceptInterviewSlotAction({
                    slotId: slot.id,
                  });
                  setBusyId(null);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  toast(
                    result.meetLink
                      ? "Booked — Meet link ready."
                      : "Interview booked.",
                  );
                  router.refresh();
                })();
              }}
              className="rounded-full bg-mingle-cta px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            >
              {busyId === slot.id ? "Booking…" : "Accept"}
            </button>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-2 text-xs text-mingle-pink">{error}</p> : null}
    </div>
  );
}

export function UpcomingInterviewBanner({
  interview,
}: {
  interview: InterviewRecord;
}) {
  return (
    <div className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-xs text-mingle-text-secondary">
      Upcoming interview: {formatInterviewWhen(interview.scheduledAt)} ·{" "}
      {interview.durationMinutes} min ·{" "}
      {interview.locationType === "video" ? "Video" : "In person"}
      {interview.meetLink ? (
        <>
          {" · "}
          <a
            href={interview.meetLink}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-mingle-cta underline"
          >
            Join Meet
          </a>
        </>
      ) : null}
    </div>
  );
}

export function GoogleCalendarConnectCard() {
  const toast = useToast();
  const router = useRouter();
  const [status, setStatus] = useState<{
    configured: boolean;
    connected: boolean;
    accountEmail: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadCompanyCalendarStatusAction().then(setStatus);
  }, []);

  if (!status) {
    return (
      <div className="rounded-xl border border-mingle-border bg-mingle-bg px-4 py-3 text-sm text-mingle-text-secondary">
        Checking calendar…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-mingle-border bg-mingle-bg px-4 py-3">
      <p className="text-sm font-semibold text-mingle-text">Google Calendar</p>
      <p className="mt-1 text-sm text-mingle-text-secondary">
        {status.connected
          ? `Connected${status.accountEmail ? ` as ${status.accountEmail}` : ""}. Interview bookings can create Meet events.`
          : status.configured
            ? "Connect Google Calendar so accepted interview slots create Meet events automatically."
            : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable calendar sync."}
      </p>
      <div className="mt-3 flex gap-2">
        {status.connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                const result = await disconnectGoogleCalendarAction();
                setBusy(false);
                if (!result.ok) {
                  toast(result.error);
                  return;
                }
                toast("Google Calendar disconnected.");
                setStatus(await loadCompanyCalendarStatusAction());
                router.refresh();
              })();
            }}
            className="rounded-full bg-mingle-surface px-4 py-2 text-xs font-semibold text-mingle-text"
          >
            Disconnect
          </button>
        ) : status.configured ? (
          <a
            href="/api/auth/google-calendar?returnTo=/settings"
            className="rounded-full bg-mingle-cta px-4 py-2 text-xs font-semibold text-white"
          >
            Connect Google Calendar
          </a>
        ) : null}
      </div>
    </div>
  );
}
