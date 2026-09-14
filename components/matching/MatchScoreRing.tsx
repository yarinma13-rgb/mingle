/**
 * Radial match gauge — uses brand semantic score colors only
 * (success / warning / error from mingle tokens).
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
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = size >= 64 ? 7 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color =
    value >= 70
      ? "var(--mingle-success)"
      : value >= 35
        ? "var(--mingle-warning)"
        : "var(--mingle-error)";
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
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-display font-bold ${labelColor} ${
          size >= 64 ? "text-sm" : "text-[11px]"
        }`}
      >
        {value}%
      </span>
    </div>
  );
}
