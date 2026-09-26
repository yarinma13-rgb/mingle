"use client";

import { useMemo, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { DEMO_DANIEL } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";

const CONFETTI_COLORS = [
  "#EA1E63",
  "#D83A52",
  "#7B2FF7",
  "#3E6BE0",
  "#FDEAF1",
  "#F1E8FE",
  "#E8F0FE",
];
const CONFETTI_COUNT = 56;

type ConfettiSpec = {
  id: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  burstX: number;
  burstY: number;
  fallY: number;
  rotBurst: number;
  rotEnd: number;
  kind: "bar" | "square" | "spark";
};

function generateConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angleDeg = 8 + Math.random() * 164;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 90 + Math.random() * 160;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (40 + Math.random() * 90);
    const kindRoll = Math.random();
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 7,
      delay: 0.01 + Math.random() * 0.22,
      duration: 2.0 + Math.random() * 0.7,
      burstX: Math.cos(rad) * distance,
      burstY: -Math.sin(rad) * distance,
      fallY: 130 + Math.random() * 120,
      rotBurst,
      rotEnd: rotBurst + spin * (90 + Math.random() * 110),
      kind: kindRoll < 0.55 ? "bar" : kindRoll < 0.82 ? "square" : "spark",
    };
  });
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

/**
 * Full-screen platform twin of MingleMomentOverlay — brand moment + confetti.
 */
export function MingleMomentScene() {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const confetti = useMemo(
    () => (reduceMotion ? [] : generateConfettiSpecs()),
    [reduceMotion],
  );

  return (
    <div className="mingle-moment-overlay relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden bg-mingle-bg px-6">
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="mingle-confetti-piece"
            style={{
              width: piece.kind === "spark" ? piece.size * 0.55 : piece.size,
              height:
                piece.kind === "bar"
                  ? piece.size * 2.4
                  : piece.kind === "spark"
                    ? piece.size * 0.55
                    : piece.size,
              borderRadius: piece.kind === "spark" ? "999px" : "2px",
              backgroundColor: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              ["--burst-x" as string]: `${piece.burstX}px`,
              ["--burst-y" as string]: `${piece.burstY}px`,
              ["--fall-y" as string]: `${piece.fallY}px`,
              ["--rot-burst" as string]: `${piece.rotBurst}deg`,
              ["--rot-end" as string]: `${piece.rotEnd}deg`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: demoEase }}
        className="relative z-[2] flex flex-col items-center text-center"
      >
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute h-48 w-48 rounded-full bg-mingle-blue/14 blur-3xl"
          />
          <span
            aria-hidden
            className="absolute h-32 w-32 rounded-full bg-mingle-accent-pink/10 blur-2xl"
          />
          <MingleLogo variant="mark" size={96} className="relative" priority />
        </div>

        <h2
          data-demo-target="mingle-headline"
          className="mt-7 max-w-full px-1 font-display text-4xl font-bold tracking-[-0.03em] text-mingle-text sm:text-5xl"
        >
          It&rsquo;s a mingle
        </h2>

        <p className="mt-4 max-w-sm text-sm text-mingle-text-secondary sm:text-base">
          You and {DEMO_DANIEL.name} both want to get to know each other.
        </p>

        <motion.div
          data-demo-target="mingle-cta"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.35, ease: demoEase }}
          className="mt-8 w-full max-w-xs rounded-full bg-mingle-cta px-8 py-3.5 text-center font-display text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,115,234,0.28)]"
        >
          Start conversation
        </motion.div>
      </motion.div>
    </div>
  );
}
