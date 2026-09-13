export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "purple" | "pink" | "green" | "amber" | "slate";
  className?: string;
}) {
  return (
    <span
      className={`mingle-chip ${
        tone === "pink"
          ? "mingle-chip-pink"
          : tone === "green"
            ? "border-mingle-success/30 bg-mingle-success/15 text-mingle-success"
            : tone === "amber"
              ? "border-mingle-warning/40 bg-mingle-warning/20 text-mingle-text"
              : tone === "slate"
                ? "border-mingle-border bg-mingle-lavender text-mingle-text-secondary"
                : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}
