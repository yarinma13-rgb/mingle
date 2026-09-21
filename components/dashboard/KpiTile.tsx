import Link from "next/link";
import { IconBadge, type IconAccent } from "@/components/dashboard/IconBadge";

type KpiTileProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  accent: IconAccent;
  href: string;
  /** Optional sparkline series (0–100-ish). Drawn with brand stroke only. */
  sparkline?: number[];
};

function Sparkline({ values, accent }: { values: number[]; accent: IconAccent }) {
  if (values.length < 2) return null;
  const width = 72;
  const height = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke =
    accent === "pink" || accent === "magenta"
      ? "var(--mingle-accent-pink, var(--mingle-pink))"
      : accent === "purple" || accent === "violet"
        ? "var(--mingle-accent-purple)"
        : accent === "success"
          ? "var(--mingle-success)"
          : accent === "waiting"
            ? "var(--mingle-warning, #ffcc00)"
            : "var(--mingle-accent-blue)";
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1 overflow-visible"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function KpiTile({
  icon,
  label,
  value,
  accent,
  href,
  sparkline,
}: KpiTileProps) {
  return (
    <Link
      href={href}
      prefetch
      className="mingle-card mingle-card-interactive flex min-w-0 cursor-pointer flex-col gap-3 bg-mingle-white p-5 hover:border-mingle-accent-purple/25 hover:shadow-[0_12px_28px_rgba(123,47,247,0.1)]"
    >
      <IconBadge icon={icon} accent={accent} size={40} iconSize={19} />
      <div>
        <p className="font-display text-2xl font-bold text-mingle-text">
          {value}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-mingle-text-secondary">
          {label}
        </p>
        {sparkline ? <Sparkline values={sparkline} accent={accent} /> : null}
      </div>
    </Link>
  );
}
