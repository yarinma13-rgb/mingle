type DashboardHeadingProps = {
  children: React.ReactNode;
  /** Compact title used on full-bleed conversation surfaces. */
  compact?: boolean;
};

export function DashboardHeading({
  children,
  compact = false,
}: DashboardHeadingProps) {
  return (
    <h1
      className={`shrink-0 font-display font-bold tracking-tight text-mingle-text ${
        compact
          ? "mb-4 text-xl sm:text-2xl"
          : "mb-8 text-[1.75rem] sm:mb-9 sm:text-3xl"
      }`}
    >
      {children}
    </h1>
  );
}
