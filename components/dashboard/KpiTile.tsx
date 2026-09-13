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
      className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-5 shadow-mingle transition-all duration-200 hover:-translate-y-0.5 hover:border-mingle-blue/30 hover:shadow-[0_12px_28px_rgba(0,115,234,0.12)]"
    >
      <IconBadge icon={icon} accent={accent} size={40} iconSize={19} />
      <div>
        <p className="font-display text-2xl font-bold text-mingle-text">
          {value}
        </p>
        <p className="mt-0.5 text-xs leading-snug text-mingle-text-secondary">{label}</p>
      </div>
    </Link>
  );
}
