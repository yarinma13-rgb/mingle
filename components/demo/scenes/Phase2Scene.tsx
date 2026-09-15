"use client";

import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { DEMO_PHASE2 } from "@/lib/demo/data";

/**
 * Investor roadmap beat — clearly labeled Phase 2 vision.
 * Does not claim these capabilities ship in the current pilot.
 */
export function Phase2Scene() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-3xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <MingleLogo size={36} priority />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mingle-accent-purple">
              {DEMO_PHASE2.eyebrow}
            </p>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-mingle-text sm:text-3xl">
              {DEMO_PHASE2.title}
            </h2>
          </div>
        </div>

        <p className="max-w-2xl text-sm leading-relaxed text-mingle-text-secondary sm:text-base">
          {DEMO_PHASE2.lead}
        </p>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {DEMO_PHASE2.pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              data-demo-target={
                index === 0
                  ? "phase2-lifecycle"
                  : index === 1
                    ? "phase2-automation"
                    : "phase2-mobile"
              }
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + index * 0.08, duration: 0.35 }}
              className="rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-muted">
                0{index + 1}
              </p>
              <h3 className="mt-2 font-display text-sm font-semibold tracking-tight text-mingle-text">
                {pillar.title}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-mingle-text-secondary">
                {pillar.body}
              </p>
            </motion.article>
          ))}
        </div>

        <p className="mt-6 text-center text-[11px] font-medium text-mingle-text-muted">
          {DEMO_PHASE2.note}
        </p>
      </motion.div>
    </div>
  );
}
