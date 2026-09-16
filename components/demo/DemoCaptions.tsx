"use client";

import { AnimatePresence, motion } from "framer-motion";
import { demoCaptionVariants } from "@/lib/demo/motion";

export function DemoCaptions({
  lines,
  visible,
}: {
  lines: string[];
  visible: boolean;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[60] flex justify-center px-4 sm:bottom-20">
      <AnimatePresence mode="wait">
        {visible && lines.length > 0 ? (
          <motion.div
            key={lines.join("|")}
            variants={demoCaptionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="demo-caption max-w-xl rounded-2xl border border-white/15 bg-[#161322]/90 px-6 py-3.5 text-center shadow-[0_18px_50px_rgba(22,19,34,0.4)] backdrop-blur-xl"
          >
            {lines.map((line, index) => (
              <motion.p
                key={line}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-[15px] font-semibold leading-snug tracking-[-0.015em] text-white sm:text-base"
              >
                {line}
              </motion.p>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
