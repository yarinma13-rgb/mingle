"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";

export function OpeningScene() {
  return (
    <div className="relative flex h-full min-h-[520px] flex-col items-center justify-center overflow-hidden px-6">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 20% 20%, #fdeaf1 0%, transparent 55%), radial-gradient(ellipse 60% 45% at 85% 15%, #e9effe 0%, transparent 50%), radial-gradient(ellipse 55% 40% at 70% 90%, #f1e8fe 0%, transparent 48%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative flex flex-col items-center"
      >
        <MingleLogo size={80} priority />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="mt-8 font-display text-3xl font-semibold tracking-tight text-mingle-text sm:text-4xl"
        >
          Meet mingle.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45 }}
          className="mt-3 text-base text-mingle-text-secondary sm:text-lg"
        >
          Beyond the match.
        </motion.p>
      </motion.div>
    </div>
  );
}
