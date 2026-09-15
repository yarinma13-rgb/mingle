"use client";

import { motion } from "framer-motion";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_COMPANY, DEMO_ROLE } from "@/lib/demo/data";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { demoEase } from "@/lib/demo/motion";

/** Company role definition — progressive reveal during guided autoplay. */
export function RoleScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showSkills = reducedMotion || elapsedMs >= 900;
  const showBeyond = reducedMotion || elapsedMs >= 2400;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl"
    >
      <div className="rounded-2xl border border-mingle-border bg-mingle-surface p-6 shadow-mingle sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
          Open role · {DEMO_COMPANY.name}
        </p>
        <h2
          data-demo-target="role-title"
          className="mt-2 font-display text-2xl font-semibold tracking-tight text-mingle-text"
        >
          {DEMO_ROLE.title}
        </h2>
        <p className="mt-1 text-sm text-mingle-text-secondary">
          {DEMO_ROLE.department} · {DEMO_ROLE.seniority} · {DEMO_ROLE.employment}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          {DEMO_ROLE.summary}
        </p>

        <div data-demo-target="role-skills" className="mt-6">
          <p className="text-xs font-semibold text-mingle-text">Skills that matter</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_ROLE.requiredSkills.map((skill, index) => {
              const visible =
                reducedMotion || (showSkills && elapsedMs >= 1100 + index * 180);
              return (
                <motion.div
                  key={skill}
                  initial={false}
                  animate={{
                    opacity: visible ? 1 : 0,
                    y: visible ? 0 : 6,
                  }}
                  transition={{ duration: 0.4, ease: demoEase }}
                >
                  <MingleChip>{skill}</MingleChip>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          data-demo-target="role-beyond"
          className="mt-5"
          initial={false}
          animate={{
            opacity: showBeyond ? 1 : 0.35,
            y: showBeyond ? 0 : 10,
          }}
          transition={{ duration: 0.45, ease: demoEase }}
        >
          <p className="text-xs font-semibold text-mingle-text">
            What matters beyond the CV
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {DEMO_ROLE.whatMatters.map((item, index) => {
              const visible =
                reducedMotion || (showBeyond && elapsedMs >= 2600 + index * 220);
              return (
                <motion.li
                  key={item}
                  initial={false}
                  animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -6 }}
                  transition={{ duration: 0.35, ease: demoEase }}
                  className="flex gap-2 text-sm text-mingle-text-secondary"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-accent-purple"
                  />
                  {item}
                </motion.li>
              );
            })}
          </ul>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2">
          {DEMO_ROLE.workModel.map((model) => (
            <MingleChip key={model} tone="pink">
              {model}
            </MingleChip>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
