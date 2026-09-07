import Link from "next/link";
import { IconBadge, type IconAccent } from "@/components/dashboard/IconBadge";

type KpiTileProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  accent: IconAccent;
  href: string;
};

export function KpiTile({ icon, label, value, accent, href }: KpiTileProps) {
  return (
    <Link
      href={href}
      prefetch
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle transition-shadow hover:shadow-mingle"
    >
      <IconBadge icon={icon} accent={accent} size={40} iconSize={19} />
      <div>
        <p className="font-display text-2xl font-bold text-mingle-text">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-mingle-text-secondary">{label}</p>
      </div>
    </Link>
  );
}
