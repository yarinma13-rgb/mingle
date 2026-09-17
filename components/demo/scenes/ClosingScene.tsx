"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

export function ClosingScene({ onReplay }: { onReplay?: () => void }) {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showTagline = reducedMotion || elapsedMs >= 4800;

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: demoEase }}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 65% 45% at 50% 0%, #e9effe 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 15% 100%, #fdeaf1 0%, transparent 50%), radial-gradient(ellipse 40% 35% at 85% 80%, #f1e8fe 0%, transparent 50%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: demoEase }}
        className="relative flex max-w-lg flex-col items-center"
      >
        <MingleLogo size={72} priority />
        <motion.div
          key={showTagline ? "tagline" : "pilot"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: demoEase }}
          className="mt-9 flex flex-col items-center"
        >
          {showTagline ? (
            <>
              <p className="font-display text-3xl font-semibold tracking-tight text-mingle-text sm:text-4xl">
                mingle
              </p>
              <p className="mt-3 text-base text-mingle-text-secondary sm:text-lg">
                Beyond the match.
              </p>
              <p className="mt-5 text-sm font-semibold text-mingle-accent-blue">
                mingle.careers
              </p>
            </>
          ) : (
            <p className="font-display text-xl font-semibold leading-snug tracking-[-0.02em] text-mingle-text sm:text-2xl">
              The first working version of mingle
              <br />
              is now ready for pilot.
            </p>
          )}
        </motion.div>
        {onReplay ? (
          <button
            type="button"
            onClick={onReplay}
            className="mingle-btn-secondary mt-10 text-xs"
          >
            Restart demo
          </button>
        ) : null}
      </motion.div>
    </div>
  );
}
