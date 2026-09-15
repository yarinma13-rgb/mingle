"use client";

import { AnimatePresence, motion } from "framer-motion";

export function DemoCaptions({
  lines,
  visible,
}: {
  lines: string[];
  visible: boolean;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-6 sm:pb-8">
      <AnimatePresence mode="wait">
        {visible && lines.length > 0 ? (
          <motion.div
            key={lines.join("|")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="demo-caption max-w-xl rounded-2xl border border-white/20 bg-[#1a1528]/78 px-5 py-3.5 text-center shadow-[0_12px_40px_rgba(37,34,56,0.28)] backdrop-blur-md"
          >
            {lines.map((line) => (
              <p
                key={line}
                className="font-display text-sm font-semibold leading-snug tracking-tight text-white sm:text-base"
              >
                {line}
              </p>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
