import { useId } from "react";

/**
 * Radial match gauge — brand pink → purple → blue gradient stroke,
 * same connection-gradient used everywhere else. Fit strength is
 * communicated by the "Why this match" copy underneath, not by
 * traffic-lighting the ring itself (see score-tone.ts).
 */
export function MatchScoreRing({
  score,
  size = 72,
  showLabel = false,
  labelBeside = false,
}: {
  score: number;
  size?: number;
  /** When true, render for light surfaces (Discover desktop aside / list). */
  showLabel?: boolean;
  /** Place "Match" to the right of the ring (profile card mockup). */
  labelBeside?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const track = showLabel ? "#e4e7fb" : "rgba(255,255,255,0.25)";
  const labelColor = showLabel ? "text-mingle-text" : "text-white";
  const shell = showLabel
    ? "bg-transparent"
    : "bg-black/25 shadow-sm backdrop-blur rounded-full";
  const strokeWidth = size >= 96 ? 9 : size >= 88 ? 8 : size >= 64 ? 7 : 5;
  const radius = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ - (value / 100) * circ;

  const ring = (
    <div
      className={`relative shrink-0 ${shell}`}
      style={{ width: size, height: size }}
      aria-label={`Match score ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={`${gid}-ring`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4e73f5" />
            <stop offset="42%" stopColor="#8b53f5" />
            <stop offset="100%" stopColor="#eb59a8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={track}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gid}-ring)`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center font-display font-bold leading-none ${labelColor}`}
      >
        <span className={size >= 88 ? "text-xl" : size >= 64 ? "text-sm" : "text-[11px]"}>
          {value}%
        </span>
        {showLabel && !labelBeside && size >= 72 ? (
          <span className="mt-0.5 text-[9px] font-semibold tracking-[0.06em] text-mingle-text-secondary">
            Match
          </span>
        ) : null}
      </span>
    </div>
  );

  if (showLabel && labelBeside) {
    return (
      <div className="flex items-center gap-2.5" aria-label={`Match score ${value}%`}>
        {ring}
        <span className="flex items-center gap-1 font-display text-sm font-bold text-mingle-text">
          Match
          <SparkleMark />
        </span>
      </div>
    );
  }

  return ring;
}

function SparkleMark() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 16 16"
      fill="#8b53f5"
      aria-hidden
      className="shrink-0"
    >
      <path d="M8 0.5 9.4 6.6 15.5 8 9.4 9.4 8 15.5 6.6 9.4 0.5 8 6.6 6.6Z" />
    </svg>
  );
}
