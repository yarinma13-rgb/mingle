/**
 * Circular match gauge — pink → purple → blue brand gradient ring.
 * Percentage draws attention; pair with WhyItWorks for trust.
 */
export function MatchScoreRing({
  score,
  size = 72,
  showLabel = false,
  caption = "Match",
}: {
  score: number;
  size?: number;
  /** When true, use light-surface styling (Discover aside / list). */
  showLabel?: boolean;
  /** Small label under the percentage when showLabel is true. */
  caption?: string | null;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = size >= 88 ? 8 : size >= 64 ? 7 : 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const gradId = `match-ring-${size}-${value}`;
  const track = showLabel
    ? "rgba(28,27,46,0.08)"
    : "rgba(255,255,255,0.28)";
  const shell = showLabel
    ? "bg-mingle-white shadow-mingle"
    : "bg-black/20 shadow-sm backdrop-blur-sm";
  const pctSize =
    size >= 96 ? "text-2xl" : size >= 80 ? "text-xl" : size >= 64 ? "text-sm" : "text-[11px]";

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
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center font-display font-bold leading-none text-mingle-text ${
          showLabel ? "" : "text-white"
        }`}
      >
        <span className={pctSize}>{value}%</span>
        {showLabel && caption ? (
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-mingle-text-secondary">
            {caption}
          </span>
        ) : null}
      </span>
    </div>
  );
}
