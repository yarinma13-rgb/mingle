"use client";

import { useEffect, useState } from "react";
import type { MatchFactorKey } from "@/lib/matching/engine";
import type {
  MatchAudience,
  MatchAxisId,
  MatchBullet,
  MatchReport,
} from "@/lib/matching/report";
import { AXIS_FACTOR_KEYS } from "@/lib/matching/report";
import { fetchAiMatchExplanation } from "@/lib/matching/ai-explanation-action";
import {
  NOT_FIT_REASONS,
  type MatchFeedbackAction,
  type NotFitReason,
} from "@/lib/matching/feedback";
import { IconBadge } from "@/components/dashboard/IconBadge";
import {
  BriefcaseIcon,
  ClockIcon,
  CodeBracketsIcon,
  ColumnsIcon,
  CompassIcon,
  GridIcon,
  GearIcon,
  HeartIcon,
  PeopleIcon,
  TargetIcon,
  ShieldCheckIcon,
} from "@/components/dashboard/icons";
import {
  scoreBandLabel,
  scoreChipClass,
  scoreTextClass,
} from "@/lib/matching/score-tone";

const CONFIDENCE_TONE: Record<MatchReport["confidence"], string> = {
  High: "text-mingle-accent-purple",
  Medium: "text-mingle-accent-blue",
  Low: "text-mingle-accent-pink",
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
  skills: GearIcon,
  location: CompassIcon,
  companyStage: BriefcaseIcon,
};

const MISMATCH_PREVIEW = 4;

const AXIS_VISUAL: Record<
  MatchAxisId,
  {
    Icon: React.ComponentType<{ className?: string; size?: number }>;
    iconBg: string;
    iconFg: string;
    bar: string;
    track: string;
    fallback: string;
  }
> = {
  role: {
    Icon: CodeBracketsIcon,
    iconBg: "bg-mingle-purple",
    iconFg: "text-white",
    bar: "bg-mingle-purple",
    track: "bg-[color:var(--mingle-light-purple)]",
    fallback: "Relevant role experience and skills for this opening.",
  },
  company: {
    Icon: PeopleIcon,
    iconBg: "bg-mingle-blue",
    iconFg: "text-white",
    bar: "bg-mingle-blue",
    track: "bg-[color:var(--mingle-light-blue)]",
    fallback: "Work style and culture signals line up with your team.",
  },
  motivation: {
    Icon: HeartIcon,
    iconBg: "bg-mingle-pink",
    iconFg: "text-white",
    bar: "bg-mingle-pink",
    track: "bg-[color:var(--mingle-light-pink)]",
    fallback: "Motivations and values point in a shared direction.",
  },
};

function axisFinding(
  axisId: MatchAxisId,
  report: MatchReport | null | undefined,
): string {
  if (!report) return AXIS_VISUAL[axisId].fallback;
  const keys = AXIS_FACTOR_KEYS[axisId];
  const fromWhy = report.why.find((b) => keys.includes(b.key));
  if (fromWhy?.finding) return fromWhy.finding;
  const fromRisk = (report.risks ?? []).find((b) => keys.includes(b.key as MatchFactorKey));
  if (fromRisk?.finding) return fromRisk.finding;
  const fromMismatch = report.mismatch.find((b) => keys.includes(b.key));
  if (fromMismatch?.finding) return fromMismatch.finding;
  return AXIS_VISUAL[axisId].fallback;
}

/** Role / Human / Motivation fit rows — product mockup styling. */
export function FitBars({
  axes,
  report,
}: {
  axes: MatchReport["axes"];
  /** Optional full report for per-axis finding copy. */
  report?: MatchReport | null;
}) {
  return (
    <div className="flex flex-col">
      {axes.map((axis, index) => {
        const visual = AXIS_VISUAL[axis.id] ?? AXIS_VISUAL.role;
        const Icon = visual.Icon;
        const pct = Math.max(0, Math.min(100, Math.round(axis.score)));
        const finding = axisFinding(axis.id, report);
        return (
          <div
            key={axis.id}
            className={`flex items-start gap-3 py-3.5 ${
              index > 0 ? "border-t border-mingle-border/80" : ""
            }`}
          >
            <span
              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${visual.iconBg} ${visual.iconFg}`}
            >
              <Icon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-bold text-mingle-text">
                {axis.label}
              </p>
              <div className="mt-1.5 flex items-center gap-2.5">
                <div
                  className={`h-2.5 min-w-0 flex-1 overflow-hidden rounded-full ${visual.track}`}
                >
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${visual.bar}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-mingle-text">
                  {pct}%
                </span>
              </div>
              <p className="mt-1.5 text-[12px] leading-snug text-mingle-text-secondary">
                {finding}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SignalChip({
  bullet,
  tone,
}: {
  bullet: MatchBullet;
  tone: "fit" | "risk";
}) {
  const Icon = BULLET_ICON[bullet.key];
    const shell =
    tone === "fit"
      ? "border-mingle-success/30 bg-mingle-success/10"
      : "border-mingle-warning/40 bg-mingle-warning/10";
  const labelTone =
    tone === "fit" ? "text-mingle-success" : "text-mingle-text";
    return (
    <div
      className={`flex min-w-0 flex-col gap-1 rounded-2xl border px-3 py-2.5 ${shell}`}
    >
      <div className="flex items-center gap-1.5">
        <IconBadge
          icon={Icon}
          accent={tone === "fit" ? "success" : "waiting"}
          size={20}
          iconSize={10}
        />
        <p className={`text-[11px] font-semibold ${labelTone}`}>
          {bullet.label}
        </p>
      </div>
      <p className="text-[12px] leading-snug text-mingle-text">{bullet.finding}</p>
    </div>
  );
}

function ChipGrid({
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
    return <p className="mt-2 text-xs text-mingle-text-secondary">{empty}</p>;
  }

  return (
    <>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visible.map((bullet) => (
          <SignalChip key={`${bullet.key}-${bullet.label}`} bullet={bullet} tone={tone} />
        ))}
      </div>
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-1.5 text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted"
        >
          {open ? "Show less" : `Show ${hidden} more`}
        </button>
      ) : null}
    </>
  );
}

const GAP_KIND_LABEL: Record<string, string> = {
  hard: "Hard gap",
  development: "Development",
  preference: "Preference",
  unknown: "Unknown",
};

const TIER_LABEL: Record<string, string> = {
  strong: "Strong match",
  potential: "Potential match",
  development: "Development match",
  low_confidence: "Low-confidence match",
};

export function MatchReportBody({
  report,
  compact,
  matchIds,
  omitOverview = false,
}: {
  report: MatchReport;
  compact?: boolean;
  /**
   * Pass only for a single OPENED match (never a list card) to auto-fetch
   * the deeper AI reasoning layer on mount. Omit to show the fast,
   * deterministic-only report (e.g. inside a list of many cards).
   */
  matchIds?: { companyId: string; candidateId: string; roleId?: string | null };
  /** Skip overall banner + fit bars when the parent already shows them. */
  omitOverview?: boolean;
}) {
  const whyTitle = "Why this match";
  const mismatchTitle = "Why not / potential risks";

  // Keyed by the exact match being fetched, not just a loading flag — so a
  // stale in-flight result for a *previous* card (e.g. after a swipe) can
  // never render against the wrong one, without needing to reset state
  // synchronously inside the effect (avoids react-hooks/set-state-in-effect;
  // setState only ever happens inside the async .then()/.catch()).
  const matchKey = matchIds
    ? `${matchIds.companyId}:${matchIds.candidateId}:${matchIds.roleId ?? ""}`
    : null;
  const [aiResult, setAiResult] = useState<{
    key: string;
    explanation: MatchReport["aiExplanation"];
    error: boolean;
  } | null>(null);

  useEffect(() => {
    // `compact` only controls visual density (used by both the Board's
    // single expanded card, which DOES want a real fetch, and
    // RoleMatchesScreen's list cards, which must not fetch per-card) — the
    // actual "single opened match" signal is matchIds being passed at all,
    // never `compact` itself. Gating on compact here previously left the
    // Board's expanded card stuck on "Analyzing…" forever.
    if (!matchIds) return;
    const key = `${matchIds.companyId}:${matchIds.candidateId}:${matchIds.roleId ?? ""}`;
    let cancelled = false;
    fetchAiMatchExplanation(matchIds)
      .then((result) => {
        if (cancelled) return;
        setAiResult({
          key,
          explanation: result.ok ? result.explanation : null,
          error: !result.ok,
        });
      })
      .catch(() => {
        if (!cancelled) setAiResult({ key, explanation: null, error: true });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchIds?.companyId, matchIds?.candidateId, matchIds?.roleId, compact]);

  const aiExplanation = aiResult?.key === matchKey ? aiResult.explanation : null;
  const aiLoading = Boolean(matchKey) && aiResult?.key !== matchKey;

  const effectiveWhy = aiExplanation?.why ?? report.why;
  const risks =
    aiExplanation?.whyNot ??
    (report.risks?.length > 0
      ? report.risks
      : report.mismatch.map((b) => ({
          key: b.key,
          label: b.label,
          finding: b.finding,
          gapKind: "preference" as const,
          evidence: b.evidence ?? ("fact" as const),
        })));
  const effectiveWhatToValidate = aiExplanation?.whatToValidate ?? report.whatToValidate;
  const effectiveNextStep = aiExplanation?.recommendedNextStep ?? {
    step: report.recommendedNextStep,
    reason: report.nextStepReason,
  };

  const riskPreview = compact ? 2 : MISMATCH_PREVIEW;
  const [risksOpen, setRisksOpen] = useState(false);
  const visibleRisks = risksOpen ? risks : risks.slice(0, riskPreview);
  const hiddenRisks = Math.max(0, risks.length - riskPreview);

  return (
    <div className="flex flex-col gap-4">
      {!omitOverview ? (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-mingle-accent-purple/20 bg-gradient-to-br from-mingle-accent-purple/8 via-mingle-accent-pink/5 to-mingle-accent-blue/8 px-3.5 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-accent-purple">
              Overall Match
            </p>
            <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-mingle-text">
              <span className={scoreTextClass(report.overall)}>
                {report.overall}%
              </span>
            </p>
            {report.mutualSummary ? (
              <p className="mt-1 max-w-[28rem] text-[12px] leading-snug text-mingle-text-secondary">
                {report.mutualSummary}
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreChipClass(report.overall)}`}
            >
              {scoreBandLabel(report.overall)}
            </span>
            {report.discoveryTier ? (
              <span className="rounded-full bg-mingle-lavender px-2.5 py-1 text-[10px] font-semibold text-mingle-text-secondary">
                {TIER_LABEL[report.discoveryTier] ?? report.discoveryTier}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {!compact && !omitOverview ? (
        <FitBars axes={report.axes} report={report} />
      ) : null}

      {report.technicalSignal ? (
        <p className="text-[11px] leading-snug text-mingle-text">
          <span className="font-semibold text-mingle-accent-blue">
            Verified technical signal:
          </span>{" "}
          <span className="text-mingle-text-secondary">
            {report.technicalSignal}
          </span>
        </p>
      ) : null}

      <div>
        <p
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${CONFIDENCE_TONE[report.confidence]}`}
        >
          <ShieldCheckIcon size={14} className="shrink-0" />
          <span>Match confidence: {report.confidence}</span>
        </p>
        {report.confidenceReason ? (
          <p className="mt-1 text-[11px] leading-snug text-mingle-text-secondary">
            {report.confidenceReason}
          </p>
        ) : null}
      </div>

      <section>
        <h3 className="flex items-center gap-1.5 font-display text-sm font-semibold tracking-tight text-mingle-success">
          {whyTitle}
          {aiLoading ? (
            <span className="text-[10px] font-normal normal-case text-mingle-text-secondary">
              Analyzing…
            </span>
          ) : aiExplanation ? (
            <span className="rounded-full bg-mingle-accent-purple/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-mingle-accent-purple">
              AI
            </span>
          ) : null}
        </h3>
        <ChipGrid
          items={effectiveWhy}
          tone="fit"
          previewCount={compact ? 2 : 4}
          empty="Nothing strongly aligned yet."
        />
      </section>

      {risks.length > 0 ? (
        <section>
          <h3 className="font-display text-sm font-semibold tracking-tight text-mingle-text-secondary">
            {mismatchTitle}
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {visibleRisks.map((risk) => (
              <div
                key={`${risk.key}-${risk.label}-${risk.finding}`}
                className="flex min-w-0 flex-col gap-1 rounded-2xl border border-mingle-warning/40 bg-mingle-warning/10 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold text-mingle-text">
                    {risk.label}
                  </p>
                  <span className="shrink-0 rounded-full bg-mingle-surface px-2 py-0.5 text-[10px] font-medium text-mingle-text-secondary">
                    {GAP_KIND_LABEL[risk.gapKind] ?? risk.gapKind}
                  </span>
                </div>
                <p className="text-[12px] leading-snug text-mingle-text">
                  {risk.finding}
                </p>
                {risk.evidence === "inference" ? (
                  <p className="text-[10px] font-medium uppercase tracking-wide text-mingle-text-secondary">
                    Inference — not confirmed fact
                  </p>
                ) : risk.evidence === "unknown" ? (
                  <p className="text-[10px] font-medium uppercase tracking-wide text-mingle-text-secondary">
                    Insufficient data
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {hiddenRisks > 0 ? (
            <button
              type="button"
              onClick={() => setRisksOpen((value) => !value)}
              className="mt-1.5 text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted"
            >
              {risksOpen ? "Show less" : `Show ${hiddenRisks} more`}
            </button>
          ) : null}
        </section>
      ) : null}

      {!compact && effectiveWhatToValidate?.length > 0 ? (
        <section>
          <h3 className="font-display text-sm font-semibold tracking-tight text-mingle-text">
            What to validate
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {effectiveWhatToValidate.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[12px] leading-snug text-mingle-text-secondary"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-accent-purple"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!compact && effectiveNextStep.step ? (
        <section className="rounded-2xl border border-mingle-border bg-mingle-bg/70 px-3.5 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
            Recommended next step
          </p>
          <p className="mt-1 font-display text-sm font-semibold text-mingle-text">
            {effectiveNextStep.step}
          </p>
          {effectiveNextStep.reason ? (
            <p className="mt-1 text-[12px] leading-snug text-mingle-text-secondary">
              {effectiveNextStep.reason}
            </p>
          ) : null}
          <p className="mt-2 text-[10px] text-mingle-text-secondary">
            AI-supported suggestion — the recruiter retains final judgment.
          </p>
        </section>
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
