"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { DEMO_DANIEL, DEMO_EMMA_MATCH_REPORT, DEMO_ROLE } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { countUp } from "@/lib/demo/typewriter";

const FITS = [
  { id: "fit-role", label: "Role Fit", score: 92, atMs: 700 },
  { id: "fit-human", label: "Human Fit", score: 87, atMs: 1400 },
  { id: "fit-motivation", label: "Motivation Fit", score: 94, atMs: 2100 },
] as const;

/**
 * Scene 05 — Your Match + fit dimensions.
 * Celebration lives in the dedicated MingleMoment scene.
 */
export function MatchScene() {
  const report = DEMO_EMMA_MATCH_REPORT;
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const overall = reducedMotion
    ? report.overall
    : countUp(report.overall, 200, 900, elapsedMs);
  const showLine = reducedMotion || elapsedMs >= 2800;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: demoEase }}
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-center gap-4 rounded-[20px] border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <Avatar
          photo={DEMO_DANIEL.photo}
          initials={DEMO_DANIEL.initials}
          gender={DEMO_DANIEL.gender}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-secondary">
            Your Match · {DEMO_ROLE.title}
          </p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-mingle-text">
            {DEMO_DANIEL.name}
          </h2>
          <p className="text-sm text-mingle-text-secondary">
            {DEMO_DANIEL.headline} · {DEMO_DANIEL.location}
          </p>
        </div>
        <div data-demo-target="match-score">
          <MatchScoreRing score={overall} size={88} showLabel />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FITS.map((fit) => {
          const visible = reducedMotion || elapsedMs >= fit.atMs;
          const value = reducedMotion
            ? fit.score
            : countUp(fit.score, fit.atMs, 600, elapsedMs);
          return (
            <motion.div
              key={fit.id}
              data-demo-target={fit.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: visible ? 1 : 0.25,
                y: visible ? 0 : 10,
              }}
              transition={{ duration: 0.4, ease: demoEase }}
              className="rounded-[18px] border border-mingle-border bg-mingle-surface px-4 py-5 text-center shadow-mingle"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mingle-text-secondary">
                {fit.label}
              </p>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-mingle-text">
                {value}%
              </p>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: showLine ? 1 : 0 }}
        transition={{ duration: 0.45, ease: demoEase }}
        className="text-center font-display text-lg font-semibold tracking-tight text-mingle-text"
      >
        A match built from more than keywords.
      </motion.p>
    </motion.div>
  );
}
