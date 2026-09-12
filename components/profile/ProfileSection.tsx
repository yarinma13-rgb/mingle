import { MingleChip } from "@/components/MingleChip";

export function ProfileChipRow({
  items,
  tone = "purple",
}: {
  items: string[];
  tone?: "purple" | "pink";
}) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <MingleChip key={item} tone={tone}>
          {item}
        </MingleChip>
      ))}
    </div>
  );
}

export function ProfileSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="profile-section flex flex-col gap-3 rounded-2xl bg-mingle-surface p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold tracking-tight text-mingle-text">
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-mingle-blue transition-colors hover:text-mingle-cta"
          >
            Edit
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
