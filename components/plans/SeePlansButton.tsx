import Link from "next/link";

function SparkleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3.5 13.6 8.4 18.5 10 13.6 11.6 12 16.5 10.4 11.6 5.5 10 10.4 8.4 12 3.5Z" />
      <path d="M18.5 15.5 19.2 17.6 21.3 18.3 19.2 19 18.5 21.1 17.8 19 15.7 18.3 17.8 17.6 18.5 15.5Z" />
    </svg>
  );
}

export function SeePlansButton({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <Link
      href="/coming-soon"
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-mingle-border bg-mingle-white font-medium text-mingle-accent-purple transition-colors hover:bg-mingle-lavender ${
        compact
          ? "h-9 px-3.5 text-xs"
          : "h-9 px-4 text-[13px]"
      }`}
    >
      <SparkleIcon size={compact ? 13 : 14} />
      See plans
    </Link>
  );
}
