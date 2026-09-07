import { IconBadge } from "@/components/dashboard/IconBadge";
import { ColumnsIcon } from "@/components/dashboard/icons";
import {
  FUNNEL_STAGES,
  type CompanyFunnel,
} from "@/lib/dashboard/funnel";

const SEGMENT_COLORS = [
  "var(--mingle-accent-pink)",
  "var(--mingle-accent-purple)",
  "var(--mingle-accent-blue)",
  "var(--mingle-warning)",
  "var(--mingle-success)",
  "var(--mingle-purple)",
];

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polar(cx, cy, r, endAngle);
  const end = polar(cx, cy, r, startAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function CompanyPipelineDonut({ funnel }: { funnel: CompanyFunnel }) {
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;
  const total = Math.max(funnel.total, 0);

  let cursor = 0;
  const slices = FUNNEL_STAGES.map((stage, index) => {
    const count = funnel.counts[stage.id];
    const sweep = total === 0 ? 0 : (count / total) * 360;
    const start = cursor;
    cursor += sweep;
    return { stage, count, start, end: cursor, color: SEGMENT_COLORS[index] };
  });

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-7 shadow-mingle">
      <div className="flex items-center gap-3">
        <IconBadge icon={ColumnsIcon} accent="purple" size={32} iconSize={15} />
        <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
          Pipeline mix
        </h2>
      </div>

      {total === 0 ? (
        <p className="mt-5 text-sm text-mingle-text-secondary">
          Stage mix appears here once you have connections on the board.
        </p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="shrink-0"
            role="img"
            aria-label="Candidate count by pipeline stage"
          >
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--mingle-border)"
              strokeWidth="22"
            />
            {slices.map((slice) =>
              slice.count === 0 || slice.end - slice.start < 0.4 ? null : (
                <path
                  key={slice.stage.id}
                  d={arcPath(cx, cy, radius, slice.start, slice.end)}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="22"
                  strokeLinecap="butt"
                />
              ),
            )}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              className="fill-mingle-text"
              fontSize="22"
              fontWeight="700"
            >
              {total}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              className="fill-mingle-text-secondary"
              fontSize="11"
            >
              in pipeline
            </text>
          </svg>
          <ul className="flex w-full flex-col gap-2">
            {slices.map((slice) => (
              <li
                key={slice.stage.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: slice.color }}
                  />
                  <span className="truncate text-mingle-text-secondary">
                    {slice.stage.label}
                  </span>
                </span>
                <span className="font-medium text-mingle-text">{slice.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
