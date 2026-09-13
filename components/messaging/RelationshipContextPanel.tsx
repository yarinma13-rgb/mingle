import Link from "next/link";
import { MingleChip } from "@/components/MingleChip";
import type { MatchFactor } from "@/lib/matching/engine";
import type { RelationshipStage } from "@/lib/supabase/types";
import type { RelationshipEventRow } from "@/lib/relationship/persistence";

const STAGE_LABEL: Record<RelationshipStage, string> = {
  connected: "Connected",
  exploring: "Exploring",
  in_conversation: "In conversation",
  interview_booked: "Interview booked",
  opportunity: "Opportunity",
  decision: "Decision",
  relationship: "Relationship",
};

const STAGE_HINT: Record<RelationshipStage, string> = {
  connected: "You matched — no messages yet.",
  exploring: "Getting to know each other.",
  in_conversation: "You're both talking.",
  interview_booked: "An interview is on the calendar.",
  opportunity: "A real opportunity is on the table.",
  decision: "Time to decide what's next.",
  relationship: "Moving forward together.",
};

const STAGE_HREF: Record<RelationshipStage, (id: string) => string> = {
  connected: (id) => `/conversations/${id}/explore`,
  exploring: (id) => `/conversations/${id}/explore`,
  in_conversation: (id) => `/conversations/${id}/opportunity`,
  interview_booked: (id) => `/conversations/${id}`,
  opportunity: (id) => `/conversations/${id}/decision`,
  decision: (id) => `/conversations/${id}/decision`,
  relationship: (id) => `/conversations/${id}`,
};

const STAGE_CTA: Record<RelationshipStage, string> = {
  connected: "Start exploring",
  exploring: "Continue exploring",
  in_conversation: "Open opportunity",
  interview_booked: "Back to chat",
  opportunity: "Record a decision",
  decision: "Review decision",
  relationship: "Back to chat",
};

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function FactorLine({ factor, tone }: { factor: MatchFactor; tone: "aligned" | "explore" }) {
  return (
    <li className="flex gap-2 text-xs text-mingle-text-secondary">
      <span
        aria-hidden
        className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
          tone === "aligned" ? "bg-mingle-accent-purple" : "bg-mingle-accent-pink"
        }`}
      />
      <span>
        <span className="font-medium text-mingle-text">{factor.label}.</span>{" "}
        {factor.detail}
      </span>
    </li>
  );
}

export function RelationshipContextPanel({
  connectionId,
  score,
  alignedFactors,
  exploreFactors,
  stage,
  timeline,
}: {
  connectionId: string;
  score: number;
  alignedFactors: MatchFactor[];
  exploreFactors: MatchFactor[];
  stage: RelationshipStage;
  timeline: RelationshipEventRow[];
}) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
      <div className="flex items-center gap-3">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ background: "var(--mingle-connection-gradient)" }}
        >
          {score}% match
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-mingle-text">
            Why this fit
          </p>
          <p className="text-xs text-mingle-text-secondary">Shared signals, not a score alone</p>
        </div>
      </div>

      <div className="rounded-xl border border-mingle-border bg-mingle-bg px-3 py-3">
        <MingleChip>{STAGE_LABEL[stage]}</MingleChip>
        <p className="mt-2 text-xs text-mingle-text-secondary">{STAGE_HINT[stage]}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-accent-purple">
          Why you connected
        </h3>
        {alignedFactors.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {alignedFactors.map((factor) => (
              <FactorLine key={factor.key} factor={factor} tone="aligned" />
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-mingle-text-secondary">
            Nothing strongly aligned yet — worth asking each other why you connected.
          </p>
        )}
      </div>

      {exploreFactors.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-accent-pink">
            Worth exploring
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {exploreFactors.map((factor) => (
              <FactorLine key={factor.key} factor={factor} tone="explore" />
            ))}
          </ul>
        </div>
      )}

      {timeline.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
            Timeline
          </h3>
          <ul className="mt-2 flex flex-col gap-2.5">
            {timeline.map((event, index) => (
              <li key={event.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex flex-col items-center">
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      index === timeline.length - 1
                        ? "bg-mingle-accent-blue"
                        : "bg-mingle-border"
                    }`}
                  />
                  {index < timeline.length - 1 && (
                    <span aria-hidden className="mt-0.5 h-4 w-px bg-mingle-border" />
                  )}
                </span>
                <span className="text-xs">
                  <MingleChip>{STAGE_LABEL[event.stage]}</MingleChip>{" "}
                  <span className="text-mingle-text-secondary">
                    {timeAgo(event.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={STAGE_HREF[stage](connectionId)}
        className="mingle-btn-primary text-center text-xs"
      >
        {STAGE_CTA[stage]}
      </Link>
    </div>
  );
}
