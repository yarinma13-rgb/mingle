import Link from "next/link";

type EmptyVariant = "default" | "search" | "inbox" | "discover";

function EmptyGlyph({ variant }: { variant: EmptyVariant }) {
  if (variant === "search") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }
  if (variant === "inbox") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
        <path d="M4 8l2.5-3h11L20 8" />
        <path d="M4 13h4l2 2h4l2-2h4" />
      </svg>
    );
  }
  if (variant === "discover") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="8.25" />
        <path d="m14.8 9.2-1.6 4-4 1.6 1.6-4Z" />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  variant = "default",
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: EmptyVariant;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-mingle-border/70 bg-mingle-lavender/80 px-8 py-12 text-center transition-shadow duration-200">
      <div
        aria-hidden
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mingle-accent-purple/12 text-mingle-accent-purple"
      >
        <EmptyGlyph variant={variant} />
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
