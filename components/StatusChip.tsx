import { MingleChip } from "@/components/MingleChip";

export type StatusChipKind =
  | "open"
  | "paused"
  | "closed"
  | "connected"
  | "pending"
  | "saved";

const META: Record<
  StatusChipKind,
  { label: string; tone: "green" | "amber" | "slate" | "purple" | "pink"; glyph: string }
> = {
  open: { label: "Open", tone: "green", glyph: "●" },
  paused: { label: "Paused", tone: "amber", glyph: "❚❚" },
  closed: { label: "Closed", tone: "slate", glyph: "■" },
  connected: { label: "Connected", tone: "green", glyph: "✓" },
  pending: { label: "Pending", tone: "amber", glyph: "…" },
  saved: { label: "Saved", tone: "purple", glyph: "★" },
};

/**
 * Shared status chip: tone + glyph + label (not color alone).
 * Use for role Open/Paused/Closed and relationship Connected/Pending/Saved.
 */
export function StatusChip({
  kind,
  label,
  className = "",
}: {
  kind: StatusChipKind;
  /** Override default label when needed. */
  label?: string;
  className?: string;
}) {
  const meta = META[kind];
  return (
    <MingleChip tone={meta.tone} className={`inline-flex items-center gap-1.5 ${className}`}>
      <span aria-hidden className="text-[10px] leading-none">
        {meta.glyph}
      </span>
      <span>{label ?? meta.label}</span>
    </MingleChip>
  );
}
