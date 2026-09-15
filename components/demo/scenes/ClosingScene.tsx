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
          Building a better way to connect talent and companies.
        </p>
        <p className="mt-5 text-sm text-mingle-text-secondary">
          Now entering the first pilot stage.
        </p>
        <p className="mt-8 font-display text-2xl font-semibold tracking-tight text-mingle-text">
          mingle
        </p>
        <p className="mt-2 text-base text-mingle-text-secondary">
          Beyond the match.
        </p>
        <p className="mt-5 text-sm font-semibold text-mingle-accent-blue">
          mingle.careers
        </p>
        {onReplay ? (
          <button
            type="button"
            onClick={onReplay}
            className="mingle-btn-secondary mt-8 text-xs"
          >
            Restart demo
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
