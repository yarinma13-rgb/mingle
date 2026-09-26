"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitInterviewFeedbackAction } from "@/lib/interviews/feedback-actions";
import { useToast } from "@/components/toast/ToastProvider";

const FIT_FIELDS = [
  { key: "technicalFit", label: "Technical fit" },
  { key: "roleFit", label: "Role fit" },
  { key: "teamFit", label: "Team fit" },
  { key: "motivationFit", label: "Motivation fit" },
] as const;

type FitKey = (typeof FIT_FIELDS)[number]["key"];

/**
 * Optional, light-touch capture after an interview completes — the first
 * real writer of public.interview_feedback (schema existed since 0024,
 * unused until now). Human judgment only; nothing here feeds a score.
 */
export function InterviewFeedbackCapture({
  connectionId,
  companyId,
  candidateId,
  roleId,
  alreadySubmitted,
}: {
  connectionId: string;
  companyId: string;
  candidateId: string;
  roleId: string | null;
  /** True once feedback already exists for this pairing — shows a done state. */
  alreadySubmitted?: boolean;
}) {
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fit, setFit] = useState<Record<FitKey, number | null>>({
    technicalFit: null,
    roleFit: null,
    teamFit: null,
    motivationFit: null,
  });
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(Boolean(alreadySubmitted));

  if (submitted) {
    return (
      <p className="mt-2 text-[11px] font-medium text-mingle-text-secondary">
        Feedback recorded — thanks.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-mingle-bg px-3 py-1.5 text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
      >
        Add interview feedback
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
              Interview feedback
            </h2>
            <p className="mt-1 text-xs text-mingle-text-secondary">
              Your own read, not a score — private, human judgment only.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {FIT_FIELDS.map(({ key, label }) => (
                <label key={key} className="block text-sm font-medium text-mingle-text">
                  {label}
                  <select
                    value={fit[key] ?? ""}
                    onChange={(event) =>
                      setFit((prev) => ({
                        ...prev,
                        [key]: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                    className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
                  >
                    <option value="">Not sure yet</option>
                    <option value={1}>1 — weak</option>
                    <option value={2}>2</option>
                    <option value={3}>3 — okay</option>
                    <option value={4}>4</option>
                    <option value={5}>5 — strong</option>
                  </select>
                </label>
              ))}
              <label className="block text-sm font-medium text-mingle-text">
                Your take
                <select
                  value={recommendation}
                  onChange={(event) => setRecommendation(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
                >
                  <option value="">Not decided yet</option>
                  <option value="advance">Advance</option>
                  <option value="hold">Hold</option>
                  <option value="pass">Pass</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-mingle-text">
                Notes
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-mingle-bg px-4 py-2 text-sm font-semibold text-mingle-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void (async () => {
                    setBusy(true);
                    const result = await submitInterviewFeedbackAction({
                      connectionId,
                      companyId,
                      candidateId,
                      roleId,
                      technicalFit: fit.technicalFit,
                      roleFit: fit.roleFit,
                      teamFit: fit.teamFit,
                      motivationFit: fit.motivationFit,
                      recommendation,
                      notes,
                    });
                    setBusy(false);
                    if (!result.ok) {
                      toast(result.error);
                      return;
                    }
                    toast("Feedback saved.");
                    setOpen(false);
                    setSubmitted(true);
                    router.refresh();
                  })();
                }}
                className="mingle-btn-primary disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save feedback"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
