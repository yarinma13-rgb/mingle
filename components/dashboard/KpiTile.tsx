import Link from "next/link";
import { IconBadge, type IconAccent } from "@/components/dashboard/IconBadge";

type KpiTileProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  accent: IconAccent;
  href: string;
  /** Week over week percent change. Hidden when null/undefined. */
  trendPercent?: number | null;
};

export function KpiTile({
  icon,
  label,
  value,
  accent,
  href,
  trendPercent = null,
}: KpiTileProps) {
  const showTrend = trendPercent != null && Number.isFinite(trendPercent);
  const up = (trendPercent ?? 0) > 0;
  const flat = trendPercent === 0;

  return (
    <Link
      href={href}
      prefetch
      className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle transition-shadow hover:shadow-mingle"
    >
      <IconBadge icon={icon} accent={accent} size={40} iconSize={19} />
      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <p className="font-display text-2xl font-bold text-mingle-text">
            {value}
          </p>
          {showTrend ? (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                flat
                  ? "text-mingle-text-secondary"
                  : up
                    ? "text-mingle-success"
                    : "text-mingle-pink-deep"
              }`}
              aria-label={
                flat
                  ? "No change versus last week"
                  : `${Math.abs(trendPercent!)} percent ${up ? "up" : "down"} versus last week`
              }
            >
              {!flat ? (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  aria-hidden
                  className={up ? "" : "rotate-180"}
                >
                  <path d="M5 1.5 9 7.5H1z" fill="currentColor" />
                </svg>
              ) : null}
              {flat ? "0%" : `${Math.abs(trendPercent!)}%`}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-snug text-mingle-text-secondary">
          {label}
        </p>
      </div>
    </Link>
  );
}
