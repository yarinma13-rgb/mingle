"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { scheduleInterviewAction } from "@/lib/interviews/actions";
import type { InterviewRecord } from "@/lib/interviews/persistence";
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

export function ScheduleInterviewControls({
  connectionId,
  companyId,
  upcoming,
}: {
  connectionId: string;
  companyId: string;
  upcoming: InterviewRecord | null;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState("");
  const [duration, setDuration] = useState(30);
  const [locationType, setLocationType] = useState<"video" | "in_person">("video");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
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
    toast("Interview scheduled.");
    setOpen(false);
    setWhen("");
    setNotes("");
    router.refresh();
  };

  return (
    <div className="flex flex-col items-end gap-2">
      {upcoming ? (
        <p className="max-w-[14rem] text-right text-xs text-mingle-text-secondary">
          Next: {formatInterviewWhen(upcoming.scheduledAt)} · {upcoming.durationMinutes} min ·{" "}
          {upcoming.locationType === "video" ? "Video" : "In person"}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-mingle-surface px-3 py-1.5 text-xs font-semibold text-mingle-text hover:bg-mingle-surface/70"
      >
        Schedule interview
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="schedule-interview-title"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-surface p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="schedule-interview-title"
              className="font-display text-lg font-bold text-mingle-text"
            >
              Schedule interview
            </h2>
            <p className="mt-2 text-sm text-mingle-text-secondary">
              Saved on mingle only. Google and Outlook sync is not connected yet.
            </p>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Date and time
              <input
                type="datetime-local"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Duration
              <select
                value={duration}
                onChange={(event) =>
                  setDuration(Number.parseInt(event.target.value, 10))
                }
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-mingle-text">Where</legend>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setLocationType("video")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    locationType === "video"
                      ? "bg-mingle-cta text-white"
                      : "bg-mingle-bg text-mingle-text-secondary"
                  }`}
                >
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => setLocationType("in_person")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    locationType === "in_person"
                      ? "bg-mingle-cta text-white"
                      : "bg-mingle-bg text-mingle-text-secondary"
                  }`}
                >
                  In person
                </button>
              </div>
            </fieldset>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Note
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm text-mingle-text outline-none focus:border-mingle-pink"
              />
            </label>
            {error ? <p className="mt-3 text-sm text-mingle-pink">{error}</p> : null}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-mingle-bg px-5 py-2.5 font-display text-sm font-semibold text-mingle-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={busy || !when}
                className="rounded-full bg-mingle-cta px-5 py-2.5 font-display text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
      {interview.notes ? ` · ${interview.notes}` : ""}
    </div>
  );
}
