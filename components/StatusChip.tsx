import { MingleChip, type MingleChipTone } from "@/components/MingleChip";

const STATUS_TONE: Record<string, MingleChipTone> = {
  pending: "violet",
  scheduled: "blue",
  completed: "green",
  cancelled: "pink",
  active: "green",
  invited: "violet",
  open: "pink",
  closed: "purple",
  paused: "violet",
  connected: "pink",
  exploring: "purple",
  in_conversation: "blue",
  opportunity: "violet",
  decision: "green",
  relationship: "purple",
};

export function StatusChip({
  status,
  label,
  className = "",
}: {
  status: string;
  label?: string;
  className?: string;
}) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  const tone = STATUS_TONE[key] ?? "purple";
  const text =
    label ??
    status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <MingleChip tone={tone} className={`shrink-0 ${className}`.trim()}>
      {text}
    </MingleChip>
  );
}
