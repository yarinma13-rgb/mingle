"use client";

import { motion } from "framer-motion";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_COMPANY, DEMO_DANIEL, DEMO_ROLE } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 04 — company role DNA, then talent ↔ company mutual bridge.
 */
export function RoleScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const t = (ms: number) => reducedMotion || elapsedMs >= ms;
  const showBridge = t(2200);

  return (
    <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-5">
      <motion.article
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: demoEase }}
        className="rounded-[20px] border border-mingle-border bg-mingle-surface p-6 shadow-mingle"
      >
        <div className="flex items-start gap-4">
          <div className="mingle-logo-tile !h-[52px] !w-[52px]">
            <span className="font-display text-lg font-bold text-mingle-text">
              {DEMO_COMPANY.initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
              {DEMO_COMPANY.name} · {DEMO_COMPANY.industry} · {DEMO_COMPANY.size}
            </p>
            <h2
              data-demo-target="role-title"
              className="mt-1 font-display text-[26px] font-bold tracking-tight text-mingle-text"
            >
              {DEMO_ROLE.title}
            </h2>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              {DEMO_ROLE.department} · {DEMO_ROLE.seniority} ·{" "}
              {DEMO_ROLE.employment}
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mingle-text-secondary">
          {DEMO_ROLE.summary}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section
            data-demo-target="role-skills"
            className="rounded-[16px] bg-[color:var(--mingle-light-purple)]/70 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Skills
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ROLE.requiredSkills.map((skill) => (
                <MingleChip key={skill}>{skill}</MingleChip>
              ))}
            </div>
          </section>

          <section
            data-demo-target="role-goals"
            className="rounded-[16px] bg-[color:var(--mingle-light-pink)]/80 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Goals
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ROLE.goals.map((goal) => (
                <MingleChip key={goal} tone="pink">
                  {goal}
                </MingleChip>
              ))}
            </div>
          </section>

          <section
            data-demo-target="role-work"
            className="rounded-[16px] bg-[color:var(--mingle-light-blue)]/80 p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Work style
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DEMO_ROLE.workStyle.map((item) => (
                <MingleChip key={item} tone="blue">
                  {item}
                </MingleChip>
              ))}
            </div>
          </section>

          <section className="rounded-[16px] bg-mingle-bg p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
              Expectations · Culture
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...DEMO_ROLE.expectations, ...DEMO_ROLE.culture].map((item) => (
                <MingleChip key={item} tone="slate">
                  {item}
                </MingleChip>
              ))}
            </div>
          </section>
        </div>
      </motion.article>

      <motion.div
        data-demo-target="mutual-bridge"
        initial={{ opacity: 0, y: 16 }}
        animate={{
          opacity: showBridge ? 1 : 0,
          y: showBridge ? 0 : 16,
        }}
        transition={{ duration: 0.7, ease: demoEase }}
        className="flex flex-col items-center gap-4 rounded-[20px] border border-mingle-border bg-white px-6 py-8 shadow-mingle"
      >
        <div className="flex w-full max-w-lg items-center justify-between gap-4">
          <motion.div
            animate={{ x: showBridge ? 0 : -24 }}
            transition={{ duration: 0.8, ease: demoEase }}
            className="flex flex-col items-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
              Talent
            </p>
            <p className="mt-1 font-display text-lg font-bold text-mingle-text">
              {DEMO_DANIEL.name}
            </p>
          </motion.div>
          <motion.div
            animate={{ scale: showBridge ? 1 : 0.85, opacity: showBridge ? 1 : 0.4 }}
            transition={{ duration: 0.7, ease: demoEase }}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-mingle-accent-pink via-mingle-accent-purple to-mingle-accent-blue text-white"
          >
            ↕
          </motion.div>
          <motion.div
            animate={{ x: showBridge ? 0 : 24 }}
            transition={{ duration: 0.8, ease: demoEase }}
            className="flex flex-col items-center"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mingle-text-secondary">
              Company
            </p>
            <p className="mt-1 font-display text-lg font-bold text-mingle-text">
              {DEMO_COMPANY.name}
            </p>
          </motion.div>
        </div>
        <p className="font-display text-xl font-bold tracking-tight text-mingle-text">
          Mutual Match
        </p>
      </motion.div>
    </div>
  );
}
