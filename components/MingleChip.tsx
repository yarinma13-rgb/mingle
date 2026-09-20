/**
 * Value Chip — single consistent pill for values, skills, and match signals.
 * Stronger color only when `tone="matched"` (relevant to current match).
 */
export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?:
    | "purple"
    | "pink"
    | "green"
    | "amber"
    | "slate"
    | "blue"
    | "matched"
    | "gap";
  className?: string;
}) {
  const toneClass =
    tone === "pink"
      ? "mingle-chip-pink"
      : tone === "blue"
        ? "mingle-chip-blue"
        : tone === "matched"
          ? "mingle-chip-matched"
          : tone === "gap"
            ? "mingle-chip-gap"
            : tone === "green"
              ? "border-mingle-success/25 bg-mingle-success/10 text-mingle-text"
              : tone === "amber"
                ? "mingle-chip-gap"
                : tone === "slate"
                  ? "border-mingle-border bg-mingle-bg text-mingle-text-secondary"
                  : "";

  return (
    <span className={`mingle-chip ${toneClass} ${className}`.trim()}>
      {children}
    </span>
  );
}

/** Alias used in Match Report / Discover when a value actively aligns. */
export function ValueChip({
  children,
  matched = false,
  gap = false,
  className = "",
}: {
  children: React.ReactNode;
  matched?: boolean;
  gap?: boolean;
  className?: string;
}) {
  return (
    <MingleChip
      tone={gap ? "gap" : matched ? "matched" : "purple"}
      className={className}
    >
      {matched ? <>✓ {children}</> : children}
    </MingleChip>
  );
}
