export type GradientAccent =
  | "pinkPurple"
  | "purpleCta"
  | "ctaPink"
  | "pinkCta"
  | "purplePink";

// Rotates through the three approved brand accents (pink, purple, cta —
// see PRODUCT_SPEC.md section 8/9) in different pairings so KPI and panel
// icon badges read as bold and varied without introducing off-palette
// colors like teal.
const GRADIENTS: Record<GradientAccent, string> = {
  pinkPurple: "from-mingle-pink to-mingle-purple",
  purpleCta: "from-mingle-purple to-mingle-cta",
  ctaPink: "from-mingle-cta to-mingle-pink",
  pinkCta: "from-mingle-pink to-mingle-cta",
  purplePink: "from-mingle-purple to-mingle-pink",
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
      className={`flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-[0_4px_10px_-2px_rgba(115,98,226,0.35)] ${GRADIENTS[accent]}`}
      style={{ width: size, height: size }}
    >
      <Icon size={iconSize} className="text-white" />
    </div>
  );
}
