export function ProfileCompletionRing({
  percent,
}: {
  percent: number;
}) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6 shadow-mingle">
      <h2 className="font-display text-base font-semibold tracking-tight text-mingle-text">
        Profile completion
      </h2>
      <div className="mt-4 flex items-center gap-5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--mingle-lavender)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={
              value >= 70
                ? "var(--mingle-success)"
                : value >= 35
                  ? "var(--mingle-warning)"
                  : "var(--mingle-error)"
            }
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="fill-mingle-text font-display text-xl font-semibold"
          >
            {value}%
          </text>
        </svg>
        <p className="max-w-[12rem] text-sm leading-relaxed text-mingle-text-secondary">
          {value >= 100
            ? "Your profile is ready for Discover."
            : "Complete your profile so companies can find a clearer match."}
        </p>
      </div>
    </div>
  );
}
