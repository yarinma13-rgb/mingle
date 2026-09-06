import Link from "next/link";

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
    <div className="flex flex-col items-center rounded-2xl bg-mingle-lavender px-8 py-12 text-center">
      <div
        aria-hidden
        className="mb-5 h-10 w-10 rounded-2xl bg-mingle-accent-purple/15"
      />
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
