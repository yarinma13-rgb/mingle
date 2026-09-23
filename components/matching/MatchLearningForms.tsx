"use client";

import { useState, useTransition } from "react";
import {
  submitEmploymentOutcomeAction,
  submitInterviewFeedbackAction,
} from "@/lib/matching/learning-actions";

/**
 * Human-in-the-loop learning capture after interviews / hires.
 * Feeds interview_feedback + employment_outcomes for future model learning.
 */
export function MatchLearningForms({
  talentId,
  roleId = null,
  interviewId = null,
}: {
  talentId: string;
  roleId?: string | null;
  interviewId?: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState("");
  const [notes, setNotes] = useState("");
  const [roleFit, setRoleFit] = useState(3);
  const [teamFit, setTeamFit] = useState(3);
  const [motivationFit, setMotivationFit] = useState(3);
  const [day30, setDay30] = useState("");
  const [day90, setDay90] = useState("");

  const saveFeedback = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await submitInterviewFeedbackAction({
        talentId,
        roleId,
        interviewId,
        roleFit,
        teamFit,
        motivationFit,
        technicalFit: roleFit,
        recommendation: recommendation || null,
        notes: notes || null,
      });
      setMessage(result.ok ? "Interview feedback saved." : result.error);
    });
  };

  const saveOutcome = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await submitEmploymentOutcomeAction({
        talentId,
        roleId,
        hireDate: new Date().toISOString().slice(0, 10),
        day30Status: day30 || null,
        day90Status: day90 || null,
        retained: day90 ? day90.toLowerCase() !== "left" : null,
      });
      setMessage(result.ok ? "Employment outcome saved." : result.error);
    });
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-mingle-text">
          Interview feedback
        </h3>
        <p className="mt-0.5 text-[11px] text-mingle-text-secondary">
          Closes the learning loop. Does not change the live match score.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["Role fit", roleFit, setRoleFit],
            ["Team fit", teamFit, setTeamFit],
            ["Motivation", motivationFit, setMotivationFit],
          ] as const
        ).map(([label, value, setter]) => (
          <label key={label} className="flex flex-col gap-1 text-[11px]">
            <span className="font-medium text-mingle-text-secondary">{label}</span>
            <input
              type="range"
              min={1}
              max={5}
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="w-full"
            />
            <span className="tabular-nums text-mingle-text">{value}/5</span>
          </label>
        ))}
      </div>

      <input
        value={recommendation}
        onChange={(e) => setRecommendation(e.target.value)}
        placeholder="Recommendation (e.g. Advance / Hold / Reject)"
        className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes — what was validated or still unknown"
        rows={3}
        className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={pending}
        onClick={saveFeedback}
        className="mingle-btn-secondary w-full rounded-full disabled:opacity-60"
      >
        Save interview feedback
      </button>

      <div className="border-t border-mingle-border pt-3">
        <h3 className="font-display text-sm font-semibold text-mingle-text">
          Employment outcomes
        </h3>
        <p className="mt-0.5 text-[11px] text-mingle-text-secondary">
          30 / 90-day status for future learning — optional.
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <input
            value={day30}
            onChange={(e) => setDay30(e.target.value)}
            placeholder="Day 30 status"
            className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
          />
          <input
            value={day90}
            onChange={(e) => setDay90(e.target.value)}
            placeholder="Day 90 status"
            className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={saveOutcome}
            className="mingle-btn-secondary w-full rounded-full disabled:opacity-60"
          >
            Save outcome
          </button>
        </div>
      </div>

      {message ? (
        <p className="text-[12px] text-mingle-text-secondary">{message}</p>
      ) : null}
    </section>
  );
}
