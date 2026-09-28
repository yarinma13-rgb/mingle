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
  const stroke = size >= 88 ? 8 : size >= 64 ? 7 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const track = showLabel
    ? "color-mix(in srgb, var(--mingle-lavender) 70%, var(--mingle-border))"
    : "rgba(255,255,255,0.25)";
  const labelColor = showLabel ? "text-mingle-text" : "text-white";
  const shell = showLabel
    ? "bg-transparent"
    : "bg-black/25 shadow-sm backdrop-blur rounded-full";

  const ring = (
    <div
      className={`relative shrink-0 ${shell}`}
      style={{ width: size, height: size }}
      aria-label={`Match score ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={`${gid}-ring`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--mingle-blue)" />
            <stop offset="45%" stopColor="var(--mingle-purple)" />
            <stop offset="100%" stopColor="var(--mingle-pink)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={track}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid}-ring)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
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
      fill="var(--mingle-purple)"
      aria-hidden
      className="shrink-0"
    >
      <path d="M8 0.5 9.4 6.6 15.5 8 9.4 9.4 8 15.5 6.6 9.4 0.5 8 6.6 6.6Z" />
    </svg>
  );
}
