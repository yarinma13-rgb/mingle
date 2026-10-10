import type { MatchReport } from "@/lib/matching/report";
import { buildCandidateComparison } from "@/lib/matching/candidate-comparison";
import { scoreChipClass, scoreTextClass } from "@/lib/matching/score-tone";

function EdgeDot({ edge, side }: { edge: "a" | "b" | "tie"; side: "a" | "b" }) {
  if (edge === "tie" || edge !== side) return null;
  return (
    <span className="rounded-full bg-mingle-accent-purple/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-mingle-accent-purple">
      Ahead
    </span>
  );
}

export function CandidateComparisonPanel({
  a,
  b,
  onClear,
}: {
  a: { name: string; report: MatchReport };
  b: { name: string; report: MatchReport };
  onClear: () => void;
}) {
  const comparison = buildCandidateComparison(a, b);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
            Comparing
          </p>
          <h3 className="mt-1 font-display text-base font-semibold text-mingle-text">
            {comparison.aName} vs {comparison.bName}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-mingle-text-secondary hover:text-mingle-text"
        >
          Clear
        </button>
      </div>

      <p className="text-sm leading-relaxed text-mingle-text">
        {comparison.summary}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {[
          { name: comparison.aName, score: comparison.aOverall, side: "a" as const },
          { name: comparison.bName, score: comparison.bOverall, side: "b" as const },
        ].map((candidate) => (
          <div
            key={candidate.side}
            className="rounded-xl border border-mingle-border bg-mingle-bg/60 p-3"
          >
            <p className="truncate text-xs font-semibold text-mingle-text">
              {candidate.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`font-display text-xl font-semibold ${scoreTextClass(candidate.score)}`}
              >
                {candidate.score}%
              </span>
              <EdgeDot edge={comparison.overallEdge} side={candidate.side} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
          Fit breakdown
        </p>
        {comparison.axisHighlights.map((axis) => (
          <div
            key={axis.key}
            className="flex items-center justify-between rounded-lg border border-mingle-border px-3 py-2"
          >
            <span className="text-xs font-medium text-mingle-text">
              {axis.label}
            </span>
            <span className="flex items-center gap-2 text-[11px] text-mingle-text-secondary">
              {axis.detail}
              {axis.edge !== "tie" ? (
                <span className="font-semibold text-mingle-accent-purple">
                  {axis.edge === "a" ? comparison.aName : comparison.bName}{" "}
                  ahead
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </div>

      {comparison.factorHighlights.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-mingle-text-secondary">
            Where they differ
          </p>
          <ul className="flex flex-col gap-1.5">
            {comparison.factorHighlights.map((highlight) => (
              <li
                key={highlight.key}
                className="text-[12px] leading-snug text-mingle-text"
              >
                <span
                  className={`mr-1.5 inline-block rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${scoreChipClass(80)}`}
                >
                  {highlight.edge === "a" ? comparison.aName : comparison.bName}
                </span>
                {highlight.detail}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {comparison.salaryNote ? (
        <p className="text-[12px] leading-snug text-mingle-text-secondary">
          {comparison.salaryNote}
        </p>
      ) : null}
    </div>
  );
}
