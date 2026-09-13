import Link from "next/link";

function EmptyGlyph() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="14" rx="3" />
      <path d="M8 20h8" />
      <path d="M12 17v3" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

export function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-mingle-border/70 bg-mingle-lavender/80 px-8 py-12 text-center transition-shadow duration-200">
      <div
        aria-hidden
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-mingle-accent-purple/12 text-mingle-accent-purple"
      >
        <EmptyGlyph />
      </div>
      <h3 className="font-display text-base font-semibold text-mingle-text">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-mingle-text-secondary">{body}</p>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="mingle-btn-primary mt-5 text-xs">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
