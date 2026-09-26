"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 01 — clean white opening. Brand first, then the thesis question.
 */
export function OpeningScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showQuestion = reducedMotion || elapsedMs >= 2200;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: demoEase }}
        className="relative flex flex-col items-center text-center"
      >
        <MingleLogo size={88} priority />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: demoEase }}
          className="mt-8 font-display text-[2rem] font-bold tracking-[-0.03em] text-mingle-text sm:text-[2.75rem]"
        >
          mingle
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.65, ease: demoEase }}
          className="mt-3 text-lg tracking-[-0.01em] text-mingle-text-secondary sm:text-xl"
        >
          Beyond the match.
        </motion.p>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{
          opacity: showQuestion ? 1 : 0,
          y: showQuestion ? 0 : 10,
        }}
        transition={{ duration: 0.75, ease: demoEase }}
        className="absolute bottom-[22%] left-0 right-0 mx-auto max-w-xl px-6 text-center font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-mingle-text sm:text-2xl"
      >
        What if hiring started with understanding — not screening?
      </motion.p>
    </div>
  );
}
