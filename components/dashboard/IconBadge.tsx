export type IconAccent = "pink" | "purple" | "blue" | "success" | "waiting";

/** @deprecated Use IconAccent */
export type GradientAccent = IconAccent;

const FILLS: Record<IconAccent, string> = {
  pink: "bg-mingle-accent-pink",
  purple: "bg-mingle-accent-purple",
  blue: "bg-mingle-accent-blue",
  success: "bg-mingle-success",
  waiting: "bg-mingle-warning",
};

type IconBadgeProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accent: IconAccent;
  size?: number;
  iconSize?: number;
};

export function IconBadge({
  icon: Icon,
  accent,
  size = 36,
  iconSize = 17,
}: IconBadgeProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center leading-none rounded-xl text-white ${FILLS[accent]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} className="block text-white" />
    </div>
  );
}
