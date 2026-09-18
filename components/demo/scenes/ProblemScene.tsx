"use client";

import { motion } from "framer-motion";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_ROLE, DEMO_COMPANY } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Problem beat — contrast keyword hiring vs mingle's human-fit view,
 * using real role language from the product.
 */
export function ProblemScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showHuman = reducedMotion || elapsedMs >= 2600;

  return (
    <div className="relative mx-auto grid w-full max-w-5xl grid-cols-1 gap-5 lg:grid-cols-2">
      <motion.div
        data-demo-target="problem-keywords"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: showHuman ? 0.45 : 1, y: 0 }}
        transition={{ duration: 0.55, ease: demoEase }}
        className="rounded-2xl border border-mingle-border bg-mingle-surface p-6 shadow-mingle sm:p-7"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
          Keyword hiring
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-mingle-text">
          Match by resume tokens
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">
          Filter for titles and skill strings — then hope the person behind the
          CV is actually a fit.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {["Senior", "Figma", "5+ years", "Remote", "B2B"].map((token) => (
            <span
              key={token}
              className="rounded-full border border-dashed border-mingle-border bg-mingle-bg px-3 py-1 text-[11px] font-medium text-mingle-text-muted"
            >
              {token}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        data-demo-target="problem-human"
        initial={{ opacity: 0, y: 14 }}
        animate={{
          opacity: showHuman ? 1 : 0.35,
          y: showHuman ? 0 : 10,
          scale: showHuman ? 1 : 0.98,
        }}
        transition={{ duration: 0.55, ease: demoEase }}
        className={`rounded-2xl border bg-mingle-surface p-6 shadow-mingle sm:p-7 ${
          showHuman
            ? "border-mingle-accent-purple/35 ring-1 ring-mingle-accent-purple/15"
            : "border-mingle-border"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-accent-purple">
          Open role · {DEMO_COMPANY.name}
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-mingle-text">
          {DEMO_ROLE.title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">
          {DEMO_ROLE.summary}
        </p>

        <div className="mt-5">
          <p className="text-xs font-semibold text-mingle-text">Skills that matter</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ROLE.requiredSkills.map((skill) => (
              <MingleChip key={skill}>{skill}</MingleChip>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-mingle-text">
            What matters beyond the CV
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {DEMO_ROLE.whatMatters.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-mingle-text-secondary"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-accent-purple"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
