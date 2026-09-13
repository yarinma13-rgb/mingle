type DiscoverSwipeActionsProps = {
  busy?: boolean;
  interestedDone?: boolean;
  onSkip: () => void;
  onInterested: () => void;
};

/**
 * Dating-app style Skip / Interested controls.
 * Pink = female avatar accent (Skip). Blue = male avatar accent (Interested).
 */
export function DiscoverSwipeActions({
  busy = false,
  interestedDone = false,
  onSkip,
  onInterested,
}: DiscoverSwipeActionsProps) {
  return (
    <div className="flex items-center justify-center gap-10 py-1">
      <button
        type="button"
        aria-label="Skip"
        disabled={busy}
        onClick={onSkip}
        className="group flex flex-col items-center gap-2 disabled:opacity-60"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mingle-accent-pink text-white shadow-[0_10px_28px_rgba(234,30,99,0.38)] transition-transform group-hover:scale-105 group-active:scale-95">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        <span className="font-display text-xs font-bold tracking-wide text-mingle-accent-pink">
          Skip
        </span>
      </button>

      <button
        type="button"
        aria-label="Interested"
        disabled={busy || interestedDone}
        onClick={onInterested}
        className="group flex flex-col items-center gap-2 disabled:opacity-60"
      >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105 group-active:scale-95 ${
            interestedDone
              ? "bg-mingle-accent-blue/80 shadow-[0_10px_28px_rgba(62,107,224,0.28)]"
              : "bg-mingle-accent-blue shadow-[0_10px_28px_rgba(62,107,224,0.4)]"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12.5l5 5L19 7" />
          </svg>
        </span>
        <span className="font-display text-xs font-bold tracking-wide text-mingle-accent-blue">
          {interestedDone ? "Interested" : "Interested"}
        </span>
      </button>
    </div>
  );
}
