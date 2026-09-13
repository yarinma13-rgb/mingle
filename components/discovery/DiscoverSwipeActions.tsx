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
            className="h-7 w-7"
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 21s-6.7-4.35-9.33-8.1C.8 10.1 1.1 6.7 3.7 5.05 6.05 3.55 8.7 4.4 12 7.15c3.3-2.75 5.95-3.6 8.3-2.1 2.6 1.65 2.9 5.05 1.03 7.85C18.7 16.65 12 21 12 21z" />
          </svg>
        </span>
        <span className="font-display text-xs font-bold tracking-wide text-mingle-accent-blue">
          {interestedDone ? "Interested" : "Interested"}
        </span>
      </button>
    </div>
  );
}
