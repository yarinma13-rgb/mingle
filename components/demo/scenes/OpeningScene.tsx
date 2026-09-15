"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";

export function OpeningScene() {
  return (
    <div className="flex h-full min-h-[520px] flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <MingleLogo size={72} priority />
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="mt-8 font-display text-3xl font-semibold tracking-tight text-mingle-text sm:text-4xl"
        >
          Meet mingle.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45 }}
          className="mt-3 text-base text-mingle-text-secondary sm:text-lg"
        >
          Beyond the match.
        </motion.p>
      </motion.div>
    </div>
  );
}
