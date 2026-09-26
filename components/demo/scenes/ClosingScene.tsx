"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 09 — final brand moment. No captions, no voiceover.
 */
export function ClosingScene({ onReplay }: { onReplay?: () => void }) {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const line1 = reducedMotion || elapsedMs >= 400;
  const line2 = reducedMotion || elapsedMs >= 2400;
  const brand = reducedMotion || elapsedMs >= 4600;
  const cta = reducedMotion || elapsedMs >= 6200;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: line1 ? 1 : 0, y: line1 ? 0 : 8 }}
          transition={{ duration: 0.65, ease: demoEase }}
          className="font-display text-2xl font-semibold tracking-tight text-mingle-text sm:text-3xl"
        >
          Hiring isn’t a transaction.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: line2 ? 1 : 0, y: line2 ? 0 : 8 }}
          transition={{ duration: 0.65, ease: demoEase }}
          className="font-display text-2xl font-semibold tracking-tight text-mingle-text sm:text-3xl"
        >
          It’s a relationship.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: brand ? 1 : 0, y: brand ? 0 : 10 }}
          transition={{ duration: 0.7, ease: demoEase }}
          className="mt-6 flex flex-col items-center"
        >
          <MingleLogo size={72} priority />
          <p className="mt-5 font-display text-3xl font-bold tracking-tight text-mingle-text">
            mingle
          </p>
          <p className="mt-2 text-lg text-mingle-text-secondary">
            Beyond the match.
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={onReplay}
          initial={{ opacity: 0 }}
          animate={{ opacity: cta ? 1 : 0 }}
          transition={{ duration: 0.55, ease: demoEase }}
          className="mingle-btn-primary mt-8"
        >
          Let’s mingle.
          <span className="mingle-btn-arrow" aria-hidden>
            →
          </span>
        </motion.button>
      </div>
    </div>
  );
}
