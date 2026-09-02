import type { MatchFactor } from "@/lib/matching/engine";
import type { RelationshipStage } from "@/lib/supabase/types";
import type { RelationshipEventRow } from "@/lib/relationship/persistence";

const STAGE_LABEL: Record<RelationshipStage, string> = {
  connected: "Connected",
  exploring: "Exploring",
  in_conversation: "In conversation",
  opportunity: "Opportunity",
  decision: "Decision",
  relationship: "Relationship",
};

const STAGE_HINT: Record<RelationshipStage, string> = {
  connected: "You matched — no messages yet.",
  exploring: "Getting to know each other.",
  in_conversation: "You're both talking.",
  opportunity: "A real opportunity is on the table.",
  decision: "Time to decide what's next.",
  relationship: "Moving forward together.",
};

function scoreGradient(score: number) {
  if (score >= 70) return "from-mingle-purple to-mingle-cta";
  if (score >= 45) return "from-mingle-pink to-mingle-purple";
  return "from-mingle-cta to-mingle-pink";
}

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
          tone === "aligned" ? "bg-mingle-purple" : "bg-mingle-pink"
        }`}
      />
      <span>
        <span className="font-medium text-mingle-white">{factor.label}.</span>{" "}
        {factor.detail}
      </span>
    </li>
  );
}

export function RelationshipContextPanel({
  score,
  alignedFactors,
  exploreFactors,
  stage,
  timeline,
}: {
  score: number;
  alignedFactors: MatchFactor[];
  exploreFactors: MatchFactor[];
  stage: RelationshipStage;
  timeline: RelationshipEventRow[];
}) {
  return (
    <div className="flex w-full flex-col gap-5 rounded-2xl border border-mingle-border bg-mingle-surface p-5 lg:w-72 lg:shrink-0">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white ${scoreGradient(score)}`}
        >
          <span className="font-display text-sm font-bold leading-none">{score}%</span>
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-mingle-white">
            A relationship, not an inbox
          </p>
          <p className="text-xs text-mingle-text-secondary">Built on shared fit</p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-mingle-purple/15 px-2.5 py-1 text-[11px] font-semibold text-mingle-purple">
            {STAGE_LABEL[stage]}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-mingle-text-secondary">{STAGE_HINT[stage]}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-purple">
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-mingle-pink">
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
                        ? "bg-mingle-purple"
                        : "bg-mingle-border"
                    }`}
                  />
                  {index < timeline.length - 1 && (
                    <span aria-hidden className="mt-0.5 h-4 w-px bg-mingle-border" />
                  )}
                </span>
                <span className="text-xs">
                  <span className="font-medium text-mingle-white">
                    {STAGE_LABEL[event.stage]}
                  </span>{" "}
                  <span className="text-mingle-text-secondary">
                    {timeAgo(event.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
