"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  cancelInterviewAction,
  rescheduleInterviewAction,
} from "@/lib/interviews/manage-actions";
import type { InterviewRecord } from "@/lib/interviews/persistence";
import { useToast } from "@/components/toast/ToastProvider";

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function InterviewListActions({
  interview,
}: {
  interview: InterviewRecord;
}) {
  const toast = useToast();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(() =>
    toLocalInput(new Date(interview.scheduledAt)),
  );
  const [duration, setDuration] = useState(interview.durationMinutes);

  if (interview.status !== "scheduled") return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link
        href={`/conversations/${interview.connectionId}`}
        className="rounded-full bg-mingle-bg px-3 py-1.5 text-xs font-semibold text-mingle-text"
      >
        Open chat
      </Link>
      <button
        type="button"
        disabled={busy}
        onClick={() => setOpen(true)}
        className="rounded-full bg-mingle-surface px-3 py-1.5 text-xs font-semibold text-mingle-text disabled:opacity-60"
      >
        Reschedule
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          void (async () => {
            if (!window.confirm("Cancel this interview?")) return;
            setBusy(true);
            const result = await cancelInterviewAction({
              interviewId: interview.id,
            });
            setBusy(false);
            if (!result.ok) {
              toast(result.error);
              return;
            }
            toast("Interview cancelled.");
            router.refresh();
          })();
        }}
        className="rounded-full bg-mingle-surface px-3 py-1.5 text-xs font-semibold text-mingle-text-secondary hover:text-mingle-pink disabled:opacity-60"
      >
        Cancel
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            className="w-full max-w-sm rounded-2xl border border-mingle-border bg-mingle-white p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold text-mingle-text">
              Reschedule interview
            </h2>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              New date and time
              <input
                type="datetime-local"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Duration
              <select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-mingle-bg px-4 py-2 text-sm font-semibold text-mingle-text-secondary"
              >
                Close
              </button>
              <button
                type="button"
                disabled={busy || !when}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    const result = await rescheduleInterviewAction({
                      interviewId: interview.id,
                      scheduledAt: new Date(when).toISOString(),
                      durationMinutes: duration,
                      locationType: interview.locationType,
                    });
                    setBusy(false);
                    if (!result.ok) {
                      toast(result.error);
                      return;
                    }
                    toast("Interview rescheduled.");
                    setOpen(false);
                    router.refresh();
                  })();
                }}
                className="rounded-full bg-mingle-cta px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
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
