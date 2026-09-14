"use client";

import { useState } from "react";
import type { MatchFactorKey } from "@/lib/matching/engine";
import type {
  MatchAudience,
  MatchBullet,
  MatchReport,
} from "@/lib/matching/report";
import {
  NOT_FIT_REASONS,
  type MatchFeedbackAction,
  type NotFitReason,
} from "@/lib/matching/feedback";
import { IconBadge, type IconAccent } from "@/components/dashboard/IconBadge";
import {
  BriefcaseIcon,
  ClockIcon,
  ColumnsIcon,
  CompassIcon,
  GridIcon,
  PeopleIcon,
  TargetIcon,
  ShieldCheckIcon,
} from "@/components/dashboard/icons";
import {
  scoreBandLabel,
  scoreBarClass,
  scoreChipClass,
  scoreTextClass,
} from "@/lib/matching/score-tone";

const CONFIDENCE_TONE: Record<MatchReport["confidence"], string> = {
  High: "text-mingle-success",
  Medium: "text-mingle-cta",
  Low: "text-mingle-text-secondary",
};

const BULLET_ICON: Record<
  MatchFactorKey,
  React.ComponentType<{ className?: string; size?: number }>
> = {
  careerGoals: TargetIcon,
  motivations: PeopleIcon,
  workStyle: ColumnsIcon,
  industry: GridIcon,
  experience: ClockIcon,
  location: CompassIcon,
  companyStage: BriefcaseIcon,
};

const MISMATCH_PREVIEW = 3;

function FitBars({ axes }: { axes: MatchReport["axes"] }) {
  return (
    <div className="flex flex-col gap-2">
      {axes.map((axis) => (
        <div key={axis.id} className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between text-[11px] text-mingle-text">
            <span>{axis.label}</span>
            <span className={`font-semibold ${scoreTextClass(axis.score)}`}>
              {axis.score}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-mingle-bg">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${scoreBarClass(axis.score)}`}
              style={{ width: `${Math.max(0, Math.min(100, axis.score))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BulletRow({
  bullet,
  accent,
}: {
  bullet: MatchBullet;
  accent: IconAccent;
}) {
  const Icon = BULLET_ICON[bullet.key];
  return (
    <li className="flex items-center gap-2 py-0.5">
      <IconBadge icon={Icon} accent={accent} size={22} iconSize={11} />
      <p className="min-w-0 text-xs leading-snug text-mingle-text">
        <span className="font-semibold">{bullet.label}:</span>{" "}
        <span className="text-mingle-text-secondary">{bullet.finding}</span>
      </p>
    </li>
  );
}

function BulletList({
  items,
  accent,
  previewCount,
  empty,
}: {
  items: MatchBullet[];
  accent: IconAccent;
  previewCount: number;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  const hidden = Math.max(0, items.length - previewCount);
  const visible = open ? items : items.slice(0, previewCount);

  if (items.length === 0) {
    return <p className="mt-1 text-xs text-mingle-text-secondary">{empty}</p>;
  }

  return (
    <>
      <ul className="mt-1 flex flex-col">
        {visible.map((bullet) => (
          <BulletRow key={bullet.key} bullet={bullet} accent={accent} />
        ))}
      </ul>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-0.5 text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted"
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </>
  );
}

export function MatchReportBody({
  report,
  compact,
}: {
  report: MatchReport;
  compact?: boolean;
}) {
  const isTalent = report.audience === "talent";
  const whyTitle = isTalent
    ? "Why this opportunity may fit you"
    : "Why this match";
  const mismatchTitle = isTalent ? "Potential consideration" : "Potential mismatch";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
            Overall Match
          </p>
          <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-mingle-text">
            <span className={scoreTextClass(report.overall)}>{report.overall}</span>
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreChipClass(report.overall)}`}
        >
          {scoreBandLabel(report.overall)}
        </span>
      </div>
      <FitBars axes={report.axes} />
      {report.technicalSignal ? (
        <p className="text-[11px] leading-snug text-mingle-text">
          <span className="font-semibold">Verified technical signal:</span>{" "}
          <span className="text-mingle-text-secondary">
            {report.technicalSignal}
          </span>
        </p>
      ) : null}
      <p
        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${CONFIDENCE_TONE[report.confidence]}`}
      >
        <ShieldCheckIcon size={14} className="shrink-0" />
        <span>Confidence: {report.confidence}</span>
      </p>
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
          {whyTitle}
        </h3>
        <BulletList
          items={report.why}
          accent="success"
          previewCount={compact ? 2 : 4}
          empty="Nothing strongly aligned yet."
        />
      </div>
      {report.mismatch.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-warning">
            {mismatchTitle}
          </h3>
          <BulletList
            items={report.mismatch}
            accent="waiting"
            previewCount={compact ? 1 : MISMATCH_PREVIEW}
            empty=""
          />
        </div>
      ) : null}
      {!compact ? (
        <p className="text-sm italic text-mingle-text-secondary">
          {report.whatMattersMost}
        </p>
      ) : null}
    </div>
  );
}

export function MatchFeedbackActions({
  audience,
  action,
  busy,
  onInterested,
  onNotFit,
  showInterested = true,
}: {
  audience: MatchAudience;
  action: MatchFeedbackAction | null;
  busy?: boolean;
  onInterested: () => void;
  onNotFit: (reason: NotFitReason) => void;
  /** When false, only the not-fit control is shown (Discover uses dating-style CTAs). */
  showInterested?: boolean;
}) {
  const [picking, setPicking] = useState(false);
  const notFitLabel = audience === "talent" ? "Not interested" : "Not a fit";
  const interestedDone = action === "interested";
  const notFitDone = action === "not_fit";

  if (picking) {
    return (
      <div className="flex w-full flex-col gap-2">
        <p className="text-[11px] text-mingle-text-secondary">
          Why? One tap is enough.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {NOT_FIT_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              disabled={busy}
              onClick={() => {
                setPicking(false);
                onNotFit(reason);
              }}
              className="rounded-full bg-mingle-lavender px-3 py-1.5 font-display text-[11px] font-semibold text-mingle-text disabled:opacity-60"
            >
              {reason}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setPicking(false)}
          className="self-start text-[11px] text-mingle-text-secondary"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showInterested ? (
        <button
          type="button"
          disabled={busy || interestedDone}
          onClick={onInterested}
          className={`rounded-full px-4 py-2 font-display text-xs font-semibold disabled:opacity-60 ${
            interestedDone
              ? "bg-mingle-blue/15 text-mingle-blue"
              : "bg-mingle-lavender text-mingle-text hover:bg-mingle-lavender/80"
          }`}
        >
          {interestedDone ? "Interested" : "Interested"}
        </button>
      ) : null}
      <button
        type="button"
        disabled={busy || notFitDone}
        onClick={() => setPicking(true)}
        className={`rounded-full px-4 py-2 font-display text-xs font-semibold disabled:opacity-60 ${
          notFitDone
            ? "text-mingle-text-secondary"
            : "text-mingle-text-secondary hover:text-mingle-text"
        }`}
      >
        {notFitDone ? notFitLabel : notFitLabel}
      </button>
    </div>
  );
}

type AskThreadEntry =
  | { id: string; kind: "human"; text: string }
  | {
      id: string;
      kind: "ai";
      status: "working" | "ready";
      workingLabel: string;
      summary?: string;
      detail?: string;
    };

const FOLLOW_UPS_COMPANY = [
  "What should I ask in a first conversation?",
  "Which mismatch should I dig into first?",
  "How confident is this ranking?",
] as const;

const FOLLOW_UPS_TALENT = [
  "What should I ask them first?",
  "Where might this not be a fit?",
  "What matters most for this match?",
] as const;

function axisLine(report: MatchReport): string {
  const parts = report.axes.map((axis) => `${axis.label} ${axis.score}%`);
  const risk = report.mismatch[0];
  if (risk) {
    return `${parts.join(" · ")} · Open risk: ${risk.label.toLowerCase()}`;
  }
  return parts.join(" · ");
}

function answerForPrompt(report: MatchReport, prompt: string): {
  summary: string;
  detail: string;
} {
  const lower = prompt.toLowerCase();
  if (lower.includes("ask") || lower.includes("conversation") || lower.includes("first")) {
    const tip =
      report.why[0]?.finding ??
      report.whatMattersMost;
    return {
      summary: "Start from the strongest overlap.",
      detail: tip,
    };
  }
  if (lower.includes("mismatch") || lower.includes("not be a fit") || lower.includes("risk")) {
    const risk = report.mismatch[0];
    return {
      summary: risk
        ? `Main open risk: ${risk.label}.`
        : "No strong mismatch flagged yet.",
      detail: risk?.finding ?? report.whatMattersMost,
    };
  }
  if (lower.includes("confident") || lower.includes("confidence")) {
    return {
      summary: `Confidence is ${report.confidence}.`,
      detail: report.whatMattersMost,
    };
  }
  if (lower.includes("matters most")) {
    return {
      summary: "What matters most for this match:",
      detail: report.whatMattersMost,
    };
  }
  return {
    summary: axisLine(report),
    detail:
      report.why[0]
        ? `${report.why[0].label}: ${report.why[0].finding}`
        : report.whatMattersMost,
  };
}

function workingLabelFor(report: MatchReport): string {
  return report.audience === "talent"
    ? "Checking Role DNA, Company DNA, and recent outcomes…"
    : "Checking Role DNA, Company DNA, and recent outcomes…";
}

/**
 * Linear-style activity thread: Ask mingle lives in the feed, not a modal.
 * Does not change DNA / scoring — presentation only.
 */
export function AskMingleButton({ report }: { report: MatchReport }) {
  const prompt =
    report.audience === "talent"
      ? "Why might this opportunity fit me?"
      : "Why did you rank this candidate?";
  const followUps =
    report.audience === "talent" ? FOLLOW_UPS_TALENT : FOLLOW_UPS_COMPANY;

  const [entries, setEntries] = useState<AskThreadEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const started = entries.length > 0;

  function appendAnswer(humanText: string) {
    if (busy) return;
    const humanId = `h-${Date.now()}`;
    const aiId = `a-${Date.now()}`;
    const working = workingLabelFor(report);
    setBusy(true);
    setEntries((prev) => [
      ...prev,
      { id: humanId, kind: "human", text: humanText },
      {
        id: aiId,
        kind: "ai",
        status: "working",
        workingLabel: working,
      },
    ]);

    window.setTimeout(() => {
      const { summary, detail } = answerForPrompt(report, humanText);
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === aiId && entry.kind === "ai"
            ? {
                ...entry,
                status: "ready",
                summary,
                detail,
              }
            : entry,
        ),
      );
      setBusy(false);
    }, 1400);
  }

  return (
    <div className="rounded-xl border border-mingle-border/80 bg-mingle-bg/60 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
        Ask mingle
      </p>

      {!started ? (
        <button
          type="button"
          onClick={() => appendAnswer(prompt)}
          className="mt-2 text-left text-[12px] font-medium text-mingle-text underline decoration-dotted underline-offset-2"
        >
          {prompt}
        </button>
      ) : null}

      {started ? (
        <div className="mt-3 flex flex-col gap-3" role="log" aria-live="polite">
          {entries.map((entry) =>
            entry.kind === "human" ? (
              <div key={entry.id} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-md bg-mingle-border"
                />
                <p className="min-w-0 text-[12.5px] leading-relaxed text-mingle-text-secondary">
                  <span className="font-semibold text-mingle-text">You</span>
                  {" — "}
                  {entry.text}
                </p>
              </div>
            ) : (
              <div key={entry.id} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-md bg-gradient-to-br from-mingle-purple to-mingle-blue"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-mingle-text">
                    mingle
                  </p>
                  {entry.status === "working" ? (
                    <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-mingle-surface px-2.5 py-1 text-[11px] text-mingle-text-secondary">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mingle-purple" />
                      {entry.workingLabel}
                    </span>
                  ) : (
                    <div className="mt-1 space-y-1.5">
                      <p className="rounded-lg border border-mingle-border bg-mingle-surface px-2.5 py-2 font-display text-[11px] leading-snug text-mingle-text-secondary">
                        {entry.summary}
                      </p>
                      {entry.detail ? (
                        <p className="text-[12px] leading-relaxed text-mingle-text-secondary">
                          {entry.detail}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      ) : null}

      {started ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {followUps.map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => appendAnswer(q)}
              className="rounded-full border border-mingle-border bg-mingle-surface px-2.5 py-1 text-[11px] font-medium text-mingle-text-secondary transition-colors hover:border-mingle-blue hover:text-mingle-text disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
