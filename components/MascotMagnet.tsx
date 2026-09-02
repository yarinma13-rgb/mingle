"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type MascotState = "dormant" | "charging" | "mutual" | "active";

const MICRO_COPY: Record<MascotState, string> = {
  dormant: "Finding your pull",
  charging: "Your connection is charging",
  mutual: "It's a mingle",
  active: "The connection is getting stronger",
};

// Illustrated character poses — one per charge state. Confirmed 2026-08-24
// as a deliberate replacement of the earlier abstract mascot design.
const POSE_IMAGES: Record<MascotState, string> = {
  dormant: "/mascot/dormant.png",
  charging: "/mascot/charging.png",
  mutual: "/mascot/mutual.png",
  active: "/mascot/active.png",
};

// One shared, slow cycle for the idle bob/sway and the charging/active
// glow pulse, so the glow visibly breathes in sync with the motion
// rather than drifting against it.
const IDLE_CYCLE_SECONDS = 4.5;

// Sampled directly from the corner pixels of the source renders
// (measured 2026-08-24, averaging ~#01041e across all four poses) —
// used as a backing tone behind the masked edge so the fade lands on a
// matching tone instead of whatever the page background happens to be.
// Reads from --mingle-mascot-backdrop so the same component adapts
// automatically between the dark theme (its own dark navy) and the
// light theme (white, matching a light card) without new art assets.
const POSE_BACKDROP_COLOR = "var(--mingle-mascot-backdrop, #01041e)";

const IMAGE_MASK =
  "radial-gradient(circle at 50% 50%, black 62%, transparent 90%)";
const BACKDROP_MASK =
  "radial-gradient(circle at 50% 50%, black 70%, transparent 100%)";

type MascotMagnetProps = {
  /** Charge state driving which pose renders. */
  state: MascotState;
  /** 0 to 100. Only meaningful in "charging" — glow and brightness rise with it. */
  intensity?: number;
  /** Pixel height of the character. */
  size?: number;
  /** Show the state's micro copy beneath the character. */
  showLabel?: boolean;
  className?: string;
};

/**
 * The mingle mascot — an illustrated horseshoe-magnet character with one
 * pose per charge state. Appears occasionally at a few meaningful
 * moments (discovery, the MINGLE moment, loading states), never as a
 * permanent fixture. Idles with a slow, continuous bob and sway so it
 * never reads as a static sticker.
 */
export function MascotMagnet({
  state,
  intensity = 50,
  size = 96,
  showLabel = true,
  className = "",
}: MascotMagnetProps) {
  const reduceMotion = useReducedMotion();
  const clampedIntensity = Math.min(Math.max(intensity, 0), 100);
  const glowPulses = state === "charging" || state === "active";

  const brightness =
    state === "charging" ? 0.75 + (clampedIntensity / 100) * 0.35 : 1;
  const glowPeak =
    state === "dormant"
      ? 0.12
      : state === "charging"
        ? 0.2 + (clampedIntensity / 100) * 0.35
        : 0.4;

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`}>
      {/* Idle layer: a slow, continuous bob and sway, always on, in every
          state, so the character reads as alive rather than a placed
          image. */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
        animate={
          reduceMotion ? undefined : { y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: IDLE_CYCLE_SECONDS,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        <motion.span
          aria-hidden
          className="absolute rounded-full bg-gradient-to-br from-mingle-pink to-mingle-cta blur-2xl"
          style={{ width: size * 0.8, height: size * 0.8 }}
          animate={
            glowPulses && !reduceMotion
              ? { opacity: [glowPeak * 0.5, glowPeak, glowPeak * 0.5] }
              : { opacity: glowPeak }
          }
          transition={
            glowPulses && !reduceMotion
              ? {
                  duration: IDLE_CYCLE_SECONDS,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.6, ease: "easeOut" }
          }
        />

        {/* Backing tone behind the masked edge — the same dark navy the
            renders were made on, so the fade lands on a matching color
            instead of whichever background happens to sit behind the
            mascot on a given screen. No border or shadow: this is a
            plain color patch, not a panel. */}
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            width: size,
            height: size,
            backgroundColor: POSE_BACKDROP_COLOR,
            WebkitMaskImage: BACKDROP_MASK,
            maskImage: BACKDROP_MASK,
          }}
        />

        <AnimatePresence mode="wait">
          <motion.img
            key={state}
            src={POSE_IMAGES[state]}
            alt=""
            initial={{ opacity: 0, scale: state === "mutual" ? 0.8 : 0.95 }}
            animate={{ opacity: 1, scale: 1, filter: `brightness(${brightness})` }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: state === "mutual" ? 0.45 : 0.3, ease: "easeOut" }}
            className="relative object-contain"
            style={{
              width: size,
              height: size,
              WebkitMaskImage: IMAGE_MASK,
              maskImage: IMAGE_MASK,
            }}
          />
        </AnimatePresence>
      </motion.div>

      {showLabel && (
        <span className="text-xs font-medium text-mingle-text-secondary">
          {MICRO_COPY[state]}
        </span>
      )}
    </div>
  );
}

export { MICRO_COPY as MASCOT_MICRO_COPY };
