"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { demoEase } from "@/lib/demo/motion";

export function OpeningScene() {
  return (
    <div className="relative flex h-full min-h-[520px] flex-col items-center justify-center overflow-hidden px-6">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: demoEase }}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 18% 18%, #fdeaf1 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 88% 12%, #e9effe 0%, transparent 52%), radial-gradient(ellipse 55% 40% at 72% 92%, #f1e8fe 0%, transparent 48%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute h-64 w-64 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(123,47,247,0.12) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: demoEase }}
        className="relative flex flex-col items-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, ease: demoEase }}
        >
          <MingleLogo size={84} priority />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55, ease: demoEase }}
          className="mt-9 font-display text-3xl font-semibold tracking-[-0.03em] text-mingle-text sm:text-[2.65rem]"
        >
          Meet mingle.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.55, ease: demoEase }}
          className="mt-3 text-base tracking-[-0.01em] text-mingle-text-secondary sm:text-lg"
        >
          Beyond the match.
        </motion.p>
      </motion.div>
    </div>
  );
}
