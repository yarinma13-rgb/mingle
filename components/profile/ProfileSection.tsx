import { MingleChip } from "@/components/MingleChip";

export function ProfileChipRow({
  items,
  tone = "purple",
}: {
  items: string[];
  tone?: "purple" | "pink";
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-mingle-text-secondary">
        Still waiting to be filled in.
      </p>
    );
  }
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

/** Small brand-tinted glyphs per profile category — stroke uses currentColor. */
function SectionGlyph({ title }: { title: string }) {
  const key = title.toLowerCase();
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (key.includes("about") || key.includes("background")) {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 19c1.5-3 4-4.5 7-4.5S17.5 16 19 19" />
      </svg>
    );
  }
  if (key.includes("work") || key.includes("how")) {
    return (
      <svg {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    );
  }
  if (key.includes("value") || key.includes("drive")) {
    return (
      <svg {...common}>
        <path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.6-7 10-7 10Z" />
      </svg>
    );
  }
  if (key.includes("looking") || key.includes("thrive")) {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M16.5 16.5 21 21" />
      </svg>
    );
  }
  if (key.includes("building") || key.includes("beyond") || key.includes("github")) {
    return (
      <svg {...common}>
        <path d="M4 19V9l8-5 8 5v10" />
        <path d="M9 19v-6h6v6" />
      </svg>
    );
  }
  if (key.includes("skill")) {
    return (
      <svg {...common}>
        <path d="M12 3 14.5 9.5 21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" />
      </svg>
    );
  }
  if (key.includes("recommend") || key.includes("explore") || key.includes("match")) {
    return (
      <svg {...common}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
        <circle cx="12" cy="12" r="4.5" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
    </svg>
  );
}

export function ProfileSection({
  title,
  onEdit,
  children,
  elevated = false,
  empty = false,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
  /** Alternate elevated brand surface for visual rhythm. */
  elevated?: boolean;
  empty?: boolean;
}) {
  return (
    <section
      className={`profile-section flex flex-col gap-3 rounded-2xl border border-mingle-border p-5 transition-shadow duration-200 sm:p-6 ${
        elevated
          ? "bg-mingle-surface-elevated shadow-mingle"
          : "bg-mingle-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mingle-lavender text-mingle-accent-purple"
            aria-hidden
          >
            <SectionGlyph title={title} />
          </span>
          <h2 className="font-display text-sm font-semibold tracking-tight text-mingle-text">
            {title}
          </h2>
        </div>
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
      {empty ? (
        <p className="rounded-xl border border-dashed border-mingle-border bg-mingle-bg/70 px-3 py-3 text-sm italic text-mingle-text-secondary">
          Still waiting on a fuller description here.
        </p>
      ) : (
        children
      )}
    </section>
  );
}
