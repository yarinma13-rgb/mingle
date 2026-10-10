"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
} from "framer-motion";

type DiscoverSwipeActionsProps = {
  busy?: boolean;
  interestedDone?: boolean;
  messageHref?: string | null;
  /** Drag x from the card — drives equal-default emphasis toward the swipe side. */
  dragX?: MotionValue<number> | null;
  onSkip: () => void;
  onSave?: () => void;
  onInterested: () => void;
};

/**
 * Dating-app controls: Skip / Save / Interested.
 * At rest both Skip and Interested are equal white circles — never glow Skip
 * by default. Swiping left/right scales and tints the matching action.
 */
export function DiscoverSwipeActions({
  busy = false,
  interestedDone = false,
  messageHref = null,
  dragX = null,
  onSkip,
  onSave,
  onInterested,
}: DiscoverSwipeActionsProps) {
  const fallbackX = useMotionValue(0);
  const x = dragX ?? fallbackX;
  const skipScale = useTransform(x, [-140, -40, 0], [1.18, 1.06, 1]);
  const interestedScale = useTransform(x, [0, 40, 140], [1, 1.06, 1.18]);
  const skipTint = useTransform(
    x,
    [-140, -40, 0],
    [
      "rgba(234, 30, 99, 0.18)",
      "rgba(234, 30, 99, 0.08)",
      "rgba(255, 255, 255, 1)",
    ],
  );
  const interestedTint = useTransform(
    x,
    [0, 40, 140],
    [
      "rgba(255, 255, 255, 1)",
      "rgba(123, 47, 247, 0.08)",
      "rgba(123, 47, 247, 0.18)",
    ],
  );
  const skipIcon = useTransform(
    x,
    [-140, 0],
    ["rgb(234, 30, 99)", "rgb(45, 27, 78)"],
  );
  const interestedIcon = useTransform(
    x,
    [0, 140],
    ["rgb(123, 47, 247)", "rgb(123, 47, 247)"],
  );

  return (
    <div className="flex items-center justify-center gap-6 py-1 sm:gap-8">
      <motion.button
        type="button"
        aria-label="Skip"
        disabled={busy}
        onClick={onSkip}
        style={{ scale: skipScale }}
        className="group flex flex-col items-center gap-1.5 disabled:opacity-60"
      >
        <motion.span
          style={{ backgroundColor: skipTint, color: skipIcon }}
          className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border border-black/10 shadow-[0_6px_18px_rgba(28,27,46,0.1)] transition-transform group-active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </motion.span>
      </motion.button>

      {messageHref ? (
        <Link
          href={messageHref}
          aria-label="Message"
          className="group flex flex-col items-center gap-1.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-mingle-blue shadow-[0_6px_18px_rgba(28,27,46,0.1)] transition-transform group-hover:scale-105 group-active:scale-95">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M4 5.5h16v11H9.5L5 20v-3.5H4v-11Z" />
            </svg>
          </span>
        </Link>
      ) : (
        <button
          type="button"
          aria-label="Save"
          disabled={busy || !onSave}
          onClick={onSave}
          className="group flex flex-col items-center gap-1.5 disabled:opacity-60"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-[#F5A524] shadow-[0_6px_18px_rgba(28,27,46,0.1)] transition-transform group-hover:scale-105 group-active:scale-95">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 3.6l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.9l-4.8 2.52.92-5.34L4.24 9.24l5.36-.78L12 3.6z" />
            </svg>
          </span>
        </button>
      )}

      <motion.button
        type="button"
        aria-label="Interested"
        disabled={busy || interestedDone}
        onClick={onInterested}
        style={{ scale: interestedScale }}
        className="group flex flex-col items-center gap-1.5 disabled:opacity-60"
      >
        <motion.span
          style={{
            backgroundColor: interestedDone
              ? "rgba(123, 47, 247, 0.16)"
              : interestedTint,
            color: interestedIcon,
          }}
          className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border border-black/10 shadow-[0_6px_18px_rgba(28,27,46,0.1)] transition-transform group-active:scale-95"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="currentColor"
            aria-hidden
          >
            {/* Classic upright heart — previous path read as tilted. */}
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </motion.span>
      </motion.button>
    </div>
  );
}
