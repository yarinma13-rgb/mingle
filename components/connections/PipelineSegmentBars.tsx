import type { RelationshipStage } from "@/lib/supabase/types";
import type { FunnelCounts } from "@/lib/dashboard/funnel";
import { STAGE_BAR_SEGMENTS } from "@/lib/dashboard/stage-colors";

export type PipelineBarRow = {
  id: string;
  label: string;
  counts: FunnelCounts;
  href?: string;
};

function totalOf(counts: FunnelCounts): number {
  return STAGE_BAR_SEGMENTS.reduce((sum, stage) => sum + counts[stage.id], 0);
}

function SegmentBar({ counts }: { counts: FunnelCounts }) {
  const total = totalOf(counts);
  if (total === 0) {
    return (
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-mingle-bg">
        <div className="h-full w-full bg-mingle-border/40" />
      </div>
    );
  }

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full bg-mingle-bg"
      role="img"
      aria-label={STAGE_BAR_SEGMENTS.map(
        (stage) => `${stage.label}: ${counts[stage.id]}`,
      ).join(", ")}
    >
      {STAGE_BAR_SEGMENTS.map((stage) => {
        const count = counts[stage.id];
        if (count <= 0) return null;
        const width = (count / total) * 100;
        return (
          <div
            key={stage.id}
            title={`${stage.label}: ${count}`}
            style={{ width: `${width}%`, background: stage.color }}
            className="h-full min-w-[2px]"
          />
        );
      })}
    </div>
  );
}

export function emptyFunnelCounts(): FunnelCounts {
  return {
    connected: 0,
    exploring: 0,
    in_conversation: 0,
    opportunity: 0,
    decision: 0,
    relationship: 0,
  };
}

export function countsFromStages(
  stages: Array<RelationshipStage | undefined>,
): FunnelCounts {
  const counts = emptyFunnelCounts();
  for (const stage of stages) {
    counts[stage ?? "connected"] += 1;
  }
  return counts;
}

export function PipelineSegmentBars({
  rows,
  title = "Pipeline by role",
}: {
  rows: PipelineBarRow[];
  title?: string;
}) {
  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
      <h2 className="font-display text-sm font-semibold text-mingle-text">
        {title}
      </h2>
      <p className="mt-1 text-xs text-mingle-text-secondary">
        One bar per row, colored by stage. Same colors as the funnel and board.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {STAGE_BAR_SEGMENTS.map((stage) => (
          <span
            key={stage.id}
            className="inline-flex items-center gap-1.5 text-[11px] text-mingle-text-secondary"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: stage.color }}
              aria-hidden
            />
            {stage.label}
          </span>
        ))}
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {rows.map((row) => {
          const total = totalOf(row.counts);
          const inner = (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-display text-sm font-semibold text-mingle-text">
                  {row.label}
                </p>
                <span className="shrink-0 text-xs font-medium text-mingle-text-secondary">
                  {total}
                </span>
              </div>
              <SegmentBar counts={row.counts} />
            </>
          );

          return (
            <li key={row.id} className="flex flex-col gap-2">
              {row.href ? (
                <a
                  href={row.href}
                  className="flex flex-col gap-2 hover:opacity-90"
                >
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
