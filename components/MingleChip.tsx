import { scoreBadgeClass } from "@/lib/matching/score-tone";

export function MingleChip({
  children,
  tone = "purple",
  score,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "purple" | "pink" | "blue" | "green" | "amber" | "slate";
  /** Match-score percentage (0-100). When set, overrides `tone` with the
   * gradient badge treatment instead of a flat tone. */
  score?: number;
  className?: string;
}) {
  return (
    <span
      className={`mingle-chip ${
        typeof score === "number"
          ? scoreBadgeClass(score)
          : tone === "pink"
            ? "mingle-chip-pink"
            : tone === "blue"
              ? "bg-[color:var(--mingle-light-blue)] text-mingle-text"
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
