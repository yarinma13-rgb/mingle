"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";

export function ClosingScene({ onReplay }: { onReplay?: () => void }) {
  return (
    <div className="relative flex h-full min-h-[520px] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 65% 45% at 50% 0%, #e9effe 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 15% 100%, #fdeaf1 0%, transparent 50%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: demoEase }}
        className="relative flex max-w-lg flex-col items-center"
      >
        <MingleLogo size={68} priority />
        <p className="mt-8 font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-mingle-text sm:text-2xl">
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
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-5 text-sm font-semibold text-mingle-accent-blue"
        >
          mingle.careers
        </motion.p>
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
