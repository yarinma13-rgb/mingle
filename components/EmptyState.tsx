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
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div
        aria-hidden
        className="mb-5 h-10 w-10 rounded-2xl bg-gradient-to-br from-mingle-pink to-mingle-purple opacity-80"
      />
      <h3 className="font-display text-base font-semibold text-mingle-white">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-mingle-text-secondary">{body}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 rounded-full bg-mingle-cta px-6 py-2.5 font-display text-xs font-semibold text-mingle-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
