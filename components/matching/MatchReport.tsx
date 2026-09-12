"use client";

import { useState } from "react";
import type { MatchFactorKey } from "@/lib/matching/engine";
import type {
  MatchAudience,
  MatchAxisId,
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
} from "@/components/dashboard/icons";

const AXIS_BAR: Record<MatchAxisId, string> = {
  role: "bg-mingle-accent-pink",
  company: "bg-mingle-accent-purple",
  motivation: "bg-mingle-accent-blue",
};

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
            <span className="font-semibold">{axis.score}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-mingle-bg">
            <div
              className={`h-full rounded-full ${AXIS_BAR[axis.id]}`}
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
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
          Overall Match
        </p>
        <p className="mt-0.5 font-display text-xl font-semibold tracking-tight text-mingle-text">
          {report.overall}{" "}
          <span className="text-sm font-medium text-mingle-text-secondary">
            {report.strength}
          </span>
        </p>
      </div>
      <FitBars axes={report.axes} />
      <p className={`text-[11px] font-semibold ${CONFIDENCE_TONE[report.confidence]}`}>
        Confidence: {report.confidence}
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
}: {
  audience: MatchAudience;
  action: MatchFeedbackAction | null;
  busy?: boolean;
  onInterested: () => void;
  onNotFit: (reason: NotFitReason) => void;
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

export function AskMingleButton({ report }: { report: MatchReport }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-mingle-text-secondary underline decoration-dotted"
      >
        Ask mingle:{" "}
        {report.audience === "talent"
          ? "Why might this opportunity fit me?"
          : "Why did you rank this candidate?"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-mingle-surface p-5 shadow-mingle">
            <p className="font-display text-sm font-semibold text-mingle-text">
              Why mingle ranked this
            </p>
            <div className="mt-4">
              <MatchReportBody report={report} />
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
