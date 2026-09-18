export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "purple" | "pink" | "green" | "amber" | "slate" | "blue" | "matched" | "gap";
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
