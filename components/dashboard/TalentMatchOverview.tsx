import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { IconBadge } from "@/components/dashboard/IconBadge";
import { CompassIcon, TargetIcon } from "@/components/dashboard/icons";
import { scoreBand } from "@/lib/matching/score-tone";

/** Brand accent arcs — same family as Company pipeline donut. */
const BAND_COLORS = {
  high: "var(--mingle-accent-pink)",
  mid: "var(--mingle-accent-purple)",
  low: "var(--mingle-accent-blue)",
} as const;

const BAND_LABELS = {
  high: "Strong match",
  mid: "Worth exploring",
  low: "Early signal",
} as const;

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

export function TalentMatchOverview({
  matchScores,
  activity,
}: {
  matchScores: number[];
  activity: {
    newConnections: number;
    activeConversations: number;
    savedCompanies: number;
  };
}) {
  const bands = { high: 0, mid: 0, low: 0 };
  for (const score of matchScores) {
    bands[scoreBand(score)] += 1;
  }
  const total = matchScores.length;
  const size = 168;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;

  const order = ["high", "mid", "low"] as const;
  const slices = order.reduce<
    { id: (typeof order)[number]; count: number; start: number; end: number; color: string }[]
  >((acc, id) => {
    const count = bands[id];
    const sweep = total === 0 ? 0 : (count / total) * 360;
    const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
    acc.push({
      id,
      count,
      start,
      end: start + sweep,
      color: BAND_COLORS[id],
    });
    return acc;
  }, []);

  const activityRows = [
    { label: "New connections", count: activity.newConnections },
    { label: "Active conversations", count: activity.activeConversations },
    { label: "Saved companies", count: activity.savedCompanies },
  ];
  const activityMax = Math.max(1, ...activityRows.map((row) => row.count));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-7 shadow-mingle">
        <div className="flex items-center gap-3">
          <IconBadge icon={TargetIcon} accent="pink" size={32} iconSize={15} />
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Match mix
          </h2>
        </div>

        {total === 0 ? (
          <div className="mt-5">
            <EmptyState
              title="No matches to chart yet"
              body="When recommended companies appear, their fit mix shows here."
              actionHref="/discover"
              actionLabel="Open Discover"
            />
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="shrink-0"
              role="img"
              aria-label="Recommended companies by match strength"
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
                    key={slice.id}
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
                matches
              </text>
            </svg>
            <ul className="flex w-full flex-col gap-2">
              {slices.map((slice) => (
                <li
                  key={slice.id}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: slice.color }}
                    />
                    <span className="truncate text-mingle-text-secondary">
                      {BAND_LABELS[slice.id]}
                    </span>
                  </span>
                  <span className="font-medium text-mingle-text">{slice.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-7 transition-shadow hover:shadow-mingle">
        <div className="flex items-center gap-3">
          <IconBadge icon={CompassIcon} accent="purple" size={32} iconSize={15} />
          <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
            Your activity
          </h2>
          <Link href="/discover" className="ml-auto text-xs font-medium text-mingle-cta">
            Open Discover
          </Link>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {activityRows.map((row) => {
            const width = Math.round((row.count / activityMax) * 100);
            return (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-mingle-text-secondary">
                  {row.label}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-mingle-bg">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-mingle-pink via-mingle-purple to-mingle-blue transition-[width] duration-500 ease-out"
                    style={{ width: `${Math.max(row.count > 0 ? 8 : 0, width)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs font-medium text-mingle-text">
                  {row.count}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-mingle-text-secondary">
          Same brand gradients as the company pipeline — your progress at a glance.
        </p>
      </div>
    </div>
  );
}
