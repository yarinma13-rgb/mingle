export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "purple" | "pink" | "blue" | "green" | "amber" | "slate" | "matched" | "gap";
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
              ? "mingle-chip-matched"
              : tone === "amber"
                ? "mingle-chip-gap"
                : tone === "slate"
                  ? "mingle-chip-gap"
                  : "";

  return (
    <span className={`mingle-chip ${toneClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
