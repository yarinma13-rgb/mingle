"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  cancelInterviewAction,
  rescheduleInterviewAction,
} from "@/lib/interviews/manage-actions";
import type { InterviewRecord } from "@/lib/interviews/persistence";
import { useToast } from "@/components/toast/ToastProvider";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

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
      <Button
        href={`/conversations/${interview.connectionId}`}
        size="sm"
      >
        Open chat
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => setOpen(true)}
      >
        Reschedule
      </Button>
      <Button
        type="button"
        variant="tertiary"
        size="sm"
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
        className="text-mingle-text-secondary hover:text-mingle-pink"
      >
        Cancel
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            className="mingle-card w-full max-w-sm p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold tracking-tight text-mingle-text">
              Reschedule interview
            </h2>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              New date and time
              <Input
                type="datetime-local"
                value={when}
                onChange={(event) => setWhen(event.target.value)}
                className="mt-1"
              />
            </label>
            <label className="mt-4 block text-sm font-medium text-mingle-text">
              Duration
              <Select
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
                className="mt-1"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </Select>
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
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
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
