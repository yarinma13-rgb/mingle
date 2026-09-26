"use client";

import { motion } from "framer-motion";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 08 — pull back to the bigger idea.
 */
export function IdeaScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showRel = reducedMotion || elapsedMs >= 900;
  const showBefore = reducedMotion || elapsedMs >= 2000;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-white px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex items-center gap-6">
          <p className="font-display text-2xl font-bold text-mingle-text sm:text-3xl">
            Talent
          </p>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-mingle-accent-pink via-mingle-accent-purple to-mingle-accent-blue text-white"
            aria-hidden
          >
            ↕
          </span>
          <p className="font-display text-2xl font-bold text-mingle-text sm:text-3xl">
            Company
          </p>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showRel ? 1 : 0, y: showRel ? 0 : 8 }}
          transition={{ duration: 0.65, ease: demoEase }}
          className="font-display text-3xl font-bold tracking-tight text-mingle-text sm:text-4xl"
        >
          Relationship
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: showBefore ? 1 : 0, y: showBefore ? 0 : 8 }}
          transition={{ duration: 0.65, ease: demoEase }}
          className="text-lg text-mingle-text-secondary sm:text-xl"
        >
          Before employment.
        </motion.p>
      </div>
    </div>
  );
}
