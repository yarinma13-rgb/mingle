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
}: {
  score: number;
  size?: number;
  /** When true, render for light surfaces (Discover desktop aside / list). */
  showLabel?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = size >= 64 ? 7 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const track = showLabel
    ? "var(--mingle-border)"
    : "rgba(255,255,255,0.25)";
  const labelColor = showLabel ? "text-mingle-text" : "text-white";
  const shell = showLabel
    ? "bg-mingle-surface-elevated shadow-mingle"
    : "bg-black/25 shadow-sm backdrop-blur";

  return (
    <div
      className={`relative shrink-0 rounded-full ${shell}`}
      style={{ width: size, height: size }}
      aria-label={`Match score ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={`${gid}-ring`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--mingle-pink)" />
            <stop offset="48%" stopColor="var(--mingle-purple)" />
            <stop offset="100%" stopColor="var(--mingle-blue)" />
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
        />
      </svg>
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center font-display font-bold leading-none ${labelColor}`}
      >
        <span className={size >= 88 ? "text-xl" : size >= 64 ? "text-sm" : "text-[11px]"}>
          {value}%
        </span>
        {showLabel && size >= 72 ? (
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-mingle-text-secondary">
            Match
          </span>
        ) : null}
      </span>
    </div>
  );
}
