export function MatchScoreRing({
  score,
  size = 52,
}: {
  score: number;
  size?: number;
}) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color =
    value >= 70
      ? "var(--mingle-success)"
      : value >= 35
        ? "var(--mingle-warning)"
        : "var(--mingle-error)";

  return (
    <div
      className="relative shrink-0 rounded-full bg-black/25 shadow-sm backdrop-blur"
      style={{ width: size, height: size }}
      aria-label={`Match score ${value}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
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
      <span className="absolute inset-0 flex items-center justify-center font-display text-[11px] font-bold text-white">
        {value}%
      </span>
    </div>
  );
}
