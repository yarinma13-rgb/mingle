"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { DEMO_DANIEL, DEMO_EMMA_MATCH_REPORT, DEMO_ROLE } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";
import { countUp } from "@/lib/demo/typewriter";

const FITS = [
  { id: "fit-role", label: "Role Fit", score: 92, atMs: 2800 },
  { id: "fit-human", label: "Human Fit", score: 87, atMs: 5800 },
  { id: "fit-motivation", label: "Motivation Fit", score: 94, atMs: 8800 },
] as const;

const CONFETTI_COLORS = ["#EA1E63", "#7B2FF7", "#3E6BE0", "#FDEAF1", "#F1E8FE"];

/**
 * Scene 05 — Your Match + fit dimensions + brief premium celebration.
 */
export function MatchScene() {
  const report = DEMO_EMMA_MATCH_REPORT;
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const overall = reducedMotion
    ? report.overall
    : countUp(report.overall, 400, 1600, elapsedMs);
  const showLine = reducedMotion || elapsedMs >= 12000;
  const showCelebrate = reducedMotion || elapsedMs >= 14500;
  const celebrateGone = !reducedMotion && elapsedMs >= 16500;

  const confetti = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: 12 + ((i * 17) % 76),
        delay: (i % 6) * 0.04,
        drift: ((i % 5) - 2) * 18,
      })),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: demoEase }}
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
            : countUp(fit.score, fit.atMs, 900, elapsedMs);
          return (
            <motion.div
              key={fit.id}
              data-demo-target={fit.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{
                opacity: visible ? 1 : 0.25,
                y: visible ? 0 : 10,
              }}
              transition={{ duration: 0.55, ease: demoEase }}
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
        transition={{ duration: 0.6, ease: demoEase }}
        className="text-center font-display text-lg font-semibold tracking-tight text-mingle-text"
      >
        A match built from more than keywords.
      </motion.p>

      <AnimatePresence>
        {showCelebrate && !celebrateGone ? (
          <motion.div
            data-demo-target="mingle-celebration"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: demoEase }}
          >
            {!reducedMotion
              ? confetti.map((piece) => (
                  <motion.span
                    key={piece.id}
                    className="absolute h-2 w-2 rounded-[2px]"
                    style={{
                      left: `${piece.left}%`,
                      top: "42%",
                      backgroundColor: piece.color,
                    }}
                    initial={{ opacity: 0, y: 0, x: 0, scale: 0.6 }}
                    animate={{
                      opacity: [0, 1, 0],
                      y: [-20, -90 - (piece.id % 40)],
                      x: piece.drift,
                      scale: 1,
                    }}
                    transition={{
                      duration: 1.25,
                      delay: piece.delay,
                      ease: demoEase,
                    }}
                  />
                ))
              : null}
            <motion.p
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: demoEase }}
              className="rounded-[16px] border border-mingle-border bg-white/95 px-8 py-4 font-display text-2xl font-bold tracking-tight text-mingle-text shadow-mingle backdrop-blur"
            >
              IT&apos;S A MINGLE!
              <span className="ml-2 text-mingle-accent-purple" aria-hidden>
                ✦
              </span>
            </motion.p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
