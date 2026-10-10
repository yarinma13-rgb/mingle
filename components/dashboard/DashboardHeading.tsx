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
          ? "mb-4 mt-1 text-xl sm:mt-0 sm:text-2xl"
          : "mb-7 mt-1 text-[1.625rem] leading-tight sm:mb-9 sm:mt-0 sm:text-3xl"
      }`}
    >
      {children}
    </h1>
  );
}
