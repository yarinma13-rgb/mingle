type MatchScoreRingProps = {
  score: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
};

export function MatchScoreRing({
  score,
  size = 72,
  stroke = 6,
  label,
  className = "",
}: MatchScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = `mingle-match-ring-${size}-${clamped}`;

  return (
    <div
      className={`inline-flex flex-col items-center gap-1 ${className}`.trim()}
      role="img"
      aria-label={`${clamped} percent match`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--mingle-accent-pink)" />
              <stop offset="50%" stopColor="var(--mingle-accent-purple)" />
              <stop offset="100%" stopColor="var(--mingle-accent-blue)" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--mingle-border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-bold text-mingle-text">
            {clamped}
          </span>
        </div>
      </div>
      {label ? (
        <span className="text-[11px] font-medium text-mingle-text-secondary">
          {label}
        </span>
      ) : null}
    </div>
  );
}
