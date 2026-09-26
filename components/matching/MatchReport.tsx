"use client";

import { useState } from "react";
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
import {
  scoreBandLabel,
} from "@/lib/matching/score-tone";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";

const MISMATCH_PREVIEW = 4;

const AXIS_BAR_CLASS: Record<string, string> = {
  role: "bg-mingle-purple",
  company: "bg-mingle-blue",
  motivation: "bg-mingle-pink",
};

function FitBars({ axes }: { axes: MatchReport["axes"] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {axes.map((axis) => (
        <div key={axis.id} className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[13px] text-mingle-text">
            <span className="font-medium">{axis.label}</span>
            <span className="font-semibold tabular-nums text-mingle-text-secondary">
              {axis.score}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-mingle-bg">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                AXIS_BAR_CLASS[axis.id] ?? "bg-mingle-purple"
              }`}
              style={{ width: `${Math.max(0, Math.min(100, axis.score))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TagChip({
  label,
  tone,
  title,
  index = 0,
}: {
  label: string;
  tone: "fit" | "risk";
  title?: string;
  index?: number;
}) {
  const shell =
    tone === "fit"
      ? index % 2 === 0
        ? "bg-mingle-light-pink text-mingle-purple"
        : "bg-mingle-light-purple text-mingle-purple"
      : index % 2 === 0
        ? "bg-[var(--mingle-gap-bg)] text-[var(--mingle-gap)]"
        : "bg-[#f7f0e8] text-[#b8824a]";
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${shell}`}
    >
      <span aria-hidden className="text-[11px] leading-none">
        {tone === "fit" ? "✓" : "○"}
      </span>
      {label}
    </span>
  );
}

function TagRow({
  items,
  tone,
  previewCount,
  empty,
}: {
  items: MatchBullet[];
  tone: "fit" | "risk";
  previewCount: number;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  const hidden = Math.max(0, items.length - previewCount);
  const visible = open ? items : items.slice(0, previewCount);

  if (items.length === 0) {
    return empty ? (
      <p className="mt-2 text-xs text-mingle-text-secondary">{empty}</p>
    ) : null;
  }

  return (
    <>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {visible.map((bullet, index) => (
          <TagChip
            key={`${bullet.key}-${bullet.label}`}
            label={bullet.label}
            tone={tone}
            title={bullet.finding}
            index={index}
          />
        ))}
      </div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-2 text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted"
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </>
  );
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.5 13.6 8.4 19.5 10 13.6 11.6 12 17.5 10.4 11.6 4.5 10 10.4 8.4 12 2.5Z" />
      <path d="M18.5 14.5 19.3 17.2 22 18 19.3 18.8 18.5 21.5 17.7 18.8 15 18 17.7 17.2 18.5 14.5Z" />
    </svg>
  );
}

export function MatchReportBody({
  report,
  compact,
}: {
  report: MatchReport;
  compact?: boolean;
}) {
  const riskItems =
    report.salaryGapPercent != null &&
    !report.mismatch.some((b) => b.label === "Salary")
      ? [
          {
            key: "experience" as const,
            label: "Compensation",
            finding: `About ${report.salaryGapPercent}% gap between expectation and role range`,
          },
          ...report.mismatch,
        ]
      : report.mismatch.map((b) =>
          b.label === "Salary" && report.salaryGapPercent != null
            ? {
                ...b,
                label: "Compensation",
                finding: `About ${report.salaryGapPercent}% gap between expectation and role range`,
              }
            : b,
        );

  const fitPreview = compact ? 2 : 4;
  const riskPreview = compact ? 2 : MISMATCH_PREVIEW;

  return (
    <div className="flex flex-col gap-5">
      {!compact ? (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mingle-light-purple text-mingle-purple">
            <SparkleIcon size={15} />
          </span>
          <h3 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Match Report
          </h3>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        <MatchScoreRing score={report.overall} size={compact ? 64 : 92} showLabel />
        <p className="min-w-0 flex-1 font-display text-base font-semibold tracking-tight text-mingle-text">
          Match
        </p>
        <span className="shrink-0 rounded-full bg-mingle-light-purple px-3 py-1.5 text-[11px] font-semibold text-mingle-purple">
          {scoreBandLabel(report.overall)}
        </span>
      </div>

      {!compact ? <FitBars axes={report.axes} /> : null}

      {report.technicalSignal ? (
        <p className="text-[11px] leading-snug text-mingle-text">
          <span className="font-semibold text-mingle-blue">
            Verified technical signal:
          </span>{" "}
          <span className="text-mingle-text-secondary">
            {report.technicalSignal}
          </span>
        </p>
      ) : null}

      <section>
        <h4 className="font-display text-sm font-semibold tracking-tight text-mingle-text">
          Why it works
        </h4>
        <TagRow
          items={report.why}
          tone="fit"
          previewCount={fitPreview}
          empty="Nothing strongly aligned yet."
        />
      </section>

      {riskItems.length > 0 ? (
        <section>
          <h4 className="font-display text-sm font-semibold tracking-tight text-mingle-text-secondary">
            Potential gaps
          </h4>
          <TagRow
            items={riskItems}
            tone="risk"
            previewCount={riskPreview}
            empty=""
          />
        </section>
      ) : null}

      {!compact ? (
        <p className="text-sm leading-relaxed text-mingle-text-secondary">
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
