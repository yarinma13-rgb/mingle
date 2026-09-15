"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";

export function ClosingScene({ onReplay }: { onReplay?: () => void }) {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex max-w-lg flex-col items-center"
      >
        <MingleLogo size={64} priority />
        <p className="mt-8 font-display text-xl font-semibold leading-snug tracking-tight text-mingle-text sm:text-2xl">
          The first working version of mingle is now ready for pilot.
        </p>
        <p className="mt-6 font-display text-2xl font-semibold tracking-tight text-mingle-text">
          mingle
        </p>
        <p className="mt-2 text-base text-mingle-text-secondary">
          Beyond the match.
        </p>
        <p className="mt-8 text-sm font-medium text-mingle-accent-purple">
          Let&apos;s mingle.
        </p>
        {onReplay ? (
          <button
            type="button"
            onClick={onReplay}
            className="mingle-btn-secondary mt-8 text-xs"
          >
            Replay demo
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
