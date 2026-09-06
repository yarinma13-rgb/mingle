export type GradientAccent =
  | "pinkPurple"
  | "purpleCta"
  | "ctaPink"
  | "pinkCta"
  | "purplePink";

// Pairings from the 2026 mark: pink, connection violet, blue.
const GRADIENTS: Record<GradientAccent, string> = {
  pinkPurple: "from-mingle-pink to-mingle-purple",
  purpleCta: "from-mingle-purple to-mingle-blue",
  ctaPink: "from-mingle-blue to-mingle-pink",
  pinkCta: "from-mingle-pink to-mingle-blue",
  purplePink: "from-mingle-purple to-mingle-pink-deep",
};

type IconBadgeProps = {
  icon: React.ComponentType<{ className?: string; size?: number }>;
  accent: GradientAccent;
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
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_10px_-2px_rgba(0,115,234,0.28)] ${GRADIENTS[accent]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} className="text-white" />
    </div>
  );
}
