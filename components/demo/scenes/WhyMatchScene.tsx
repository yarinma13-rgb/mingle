"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import {
  DEMO_DANIEL,
  DEMO_EMMA_MATCH_REPORT,
  DEMO_ROLE,
} from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 06 — Why this match / What to explore (trust over vanity score).
 */
export function WhyMatchScene() {
  const report = DEMO_EMMA_MATCH_REPORT;
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showWhy = reducedMotion || elapsedMs >= 1800;
  const showExplore = reducedMotion || elapsedMs >= 12000;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: demoEase }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-center gap-4 rounded-[20px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <Avatar
          photo={DEMO_DANIEL.photo}
          initials={DEMO_DANIEL.initials}
          gender={DEMO_DANIEL.gender}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-bold text-mingle-text">
            {DEMO_DANIEL.name}
          </p>
          <p className="text-sm text-mingle-text-secondary">
            {DEMO_ROLE.title} · {report.overall}% Match
          </p>
        </div>
        <MatchScoreRing score={report.overall} size={72} showLabel />
      </div>

      <motion.section
        data-demo-target="why-fits"
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: showWhy ? 1 : 0.3,
          y: showWhy ? 0 : 10,
        }}
        transition={{ duration: 0.55, ease: demoEase }}
        className="rounded-[20px] border border-mingle-border bg-mingle-surface p-6 shadow-mingle"
      >
        <h2 className="font-display text-xl font-bold tracking-tight text-mingle-text">
          Why This Match
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          Why it fits
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {report.why.slice(0, 3).map((item) => (
            <li
              key={item.label}
              className="flex items-start gap-3 rounded-[14px] bg-[color:var(--mingle-light-purple)]/70 px-4 py-3"
            >
              <span
                aria-hidden
                className="mt-0.5 font-bold text-mingle-accent-purple"
              >
                ✓
              </span>
              <div>
                <p className="text-[15px] font-semibold text-mingle-text">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[13px] text-mingle-text-secondary">
                  {item.finding}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section
        data-demo-target="what-explore"
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: showExplore ? 1 : 0.25,
          y: showExplore ? 0 : 10,
        }}
        transition={{ duration: 0.55, ease: demoEase }}
        className="rounded-[20px] border border-mingle-border bg-[color:var(--mingle-gap-bg)] p-6 shadow-mingle"
      >
        <h2 className="font-display text-xl font-bold tracking-tight text-mingle-text">
          What to explore
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          Transparent signals for a better first conversation — not rejection.
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {report.mismatch.map((item) => (
            <li
              key={item.label}
              className="flex items-start gap-3 rounded-[14px] bg-white/80 px-4 py-3"
            >
              <span
                aria-hidden
                className="mt-0.5 font-semibold text-[color:var(--mingle-gap-accent)]"
              >
                →
              </span>
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[color:var(--mingle-gap-accent)]">
                  Potential gap
                </p>
                <p className="text-[15px] font-semibold text-mingle-text">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[13px] text-mingle-text-secondary">
                  {item.finding}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.div>
  );
}
