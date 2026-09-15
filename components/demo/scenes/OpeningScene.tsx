"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";

export function OpeningScene() {
  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 18% 18%, #fdeaf1 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 88% 12%, #e9effe 0%, transparent 52%), radial-gradient(ellipse 55% 40% at 72% 92%, #f1e8fe 0%, transparent 48%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: demoEase }}
        className="relative flex flex-col items-center"
      >
        <MingleLogo size={84} priority />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.5, ease: demoEase }}
          className="mt-9 font-display text-3xl font-semibold tracking-[-0.03em] text-mingle-text sm:text-[2.65rem]"
        >
          Meet mingle.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: demoEase }}
          className="mt-3 text-base tracking-[-0.01em] text-mingle-text-secondary sm:text-lg"
        >
          Beyond the match.
        </motion.p>
      </motion.div>
    </div>
  );
}
