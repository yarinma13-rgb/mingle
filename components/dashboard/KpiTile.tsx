import { IconBadge, type GradientAccent } from "@/components/dashboard/IconBadge";

type KpiTileProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  value: string;
  accent: GradientAccent;
};

export function KpiTile({ icon, label, value, accent }: KpiTileProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-surface p-5">
      <IconBadge icon={icon} accent={accent} size={40} iconSize={19} />
      <div>
        <p className="font-display text-2xl font-bold text-mingle-white">
          {value}
        </p>
        <p className="mt-0.5 text-xs text-mingle-text-secondary">{label}</p>
      </div>
    </div>
  );
}
