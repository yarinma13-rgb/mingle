/**
 * Radial match gauge — pink → purple → blue brand gradient.
 * Communicates fit strength without traffic-light semantics.
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
  const gradId = `match-ring-${size}-${value}`;
  const track = showLabel
    ? "rgba(28,27,46,0.08)"
    : "rgba(255,255,255,0.28)";
  const labelColor = showLabel ? "text-mingle-text" : "text-white";
  const shell = showLabel
    ? "bg-mingle-surface shadow-mingle"
    : "bg-black/20 shadow-sm backdrop-blur";

  return (
    <div
      className={`relative shrink-0 rounded-full ${shell}`}
      style={{ width: size, height: size }}
      aria-label={`Match score ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA1E63" />
            <stop offset="48%" stopColor="#7B2FF7" />
            <stop offset="100%" stopColor="#3E6BE0" />
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
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center font-display font-bold leading-none ${labelColor} ${
          size >= 88 ? "text-lg" : size >= 64 ? "text-sm" : "text-[11px]"
        }`}
      >
        {value}%
      </span>
    </div>
  );
}
