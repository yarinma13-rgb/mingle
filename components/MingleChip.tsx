export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "purple" | "pink";
  className?: string;
}) {
  return (
    <span
      className={`mingle-chip ${tone === "pink" ? "mingle-chip-pink" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
