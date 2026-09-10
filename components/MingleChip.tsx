export type MingleChipTone = "purple" | "pink" | "blue" | "green" | "violet";

const TONE_CLASS: Record<MingleChipTone, string> = {
  purple: "",
  pink: "mingle-chip-pink",
  blue: "mingle-chip-blue",
  green: "mingle-chip-green",
  violet: "mingle-chip-violet",
};

export function MingleChip({
  children,
  tone = "purple",
  className = "",
}: {
  children: React.ReactNode;
  tone?: MingleChipTone;
  className?: string;
}) {
  return (
    <span className={`mingle-chip ${TONE_CLASS[tone]} ${className}`.trim()}>
      {children}
    </span>
  );
}
