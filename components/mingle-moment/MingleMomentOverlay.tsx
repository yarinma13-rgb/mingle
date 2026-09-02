"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
// Mascot temporarily removed from this screen — see components/MascotMagnet.tsx,
// component and pose assets are kept, just not rendered here for now.

// Confetti burst origin is the M mark. Angle is computed in JS:
// 0deg = right, 90deg = up. 20–160deg is the upper fan (up and to the
// sides). Palette stays inside PRODUCT_SPEC section 8.
const CONFETTI_COLORS = [
  "#E2378D",
  "#F06AA8",
  "#C41F75",
  "#7362E2",
  "#9588EA",
  "#5A48C9",
  "#4D42DB",
  "#7A72E8",
  "#3A31B8",
  "#FFFFFF",
  "#E1E4EA",
];
const CONFETTI_COUNT = 28;

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
};

function generateConfettiSpecs(): ConfettiSpec[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    const angleDeg = 20 + Math.random() * 140;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 72 + Math.random() * 110;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (36 + Math.random() * 70);
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 5,
      delay: 0.02 + Math.random() * 0.18,
      duration: 2.15 + Math.random() * 0.45,
      burstX: Math.cos(rad) * distance,
      burstY: -Math.sin(rad) * distance,
      fallY: 110 + Math.random() * 90,
      rotBurst,
      rotEnd: rotBurst + spin * (80 + Math.random() * 90),
    };
  });
}

function useConfettiSpecs(): ConfettiSpec[] {
  const [specs, setSpecs] = useState<ConfettiSpec[]>([]);
  useEffect(() => {
    Promise.resolve().then(() => setSpecs(generateConfettiSpecs()));
  }, []);
  return specs;
}

export function MingleMomentOverlay({
  matchName,
  matchUserId,
  onClose,
}: {
  matchName: string;
  matchUserId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const confetti = useConfettiSpecs();

  useEffect(() => {
    if (reduceMotion) return;
    if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
    const timer = setTimeout(() => {
      try {
        navigator.vibrate([15, 40, 15]);
      } catch {
        // Unsupported — skip silently per spec.
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  const startConversation = () => {
    onClose();
    if (matchUserId) router.push(`/profile/view/${matchUserId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0F1420] px-6"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-[2] flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="mingle-confetti-piece"
            style={{
              width: piece.size,
              height: piece.size * 2.2,
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

      <div className="relative z-[2] flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <span
            aria-hidden
            className="absolute h-32 w-32 rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple opacity-40 blur-3xl"
          />
          <MingleLogo variant="mark" size={72} className="relative" priority />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45, ease: "easeOut" }}
          className="mt-6 max-w-full px-1 font-display text-3xl font-bold text-white sm:text-5xl"
        >
          It&rsquo;s a mingle
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.85 }}
          className="mt-4 max-w-xs text-sm text-white/70"
        >
          You and {matchName} both want to get to know each other.
        </motion.p>

        <motion.button
          type="button"
          onClick={startConversation}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 1.3, ease: "easeOut" }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="mt-8 w-full max-w-xs rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-white"
        >
          Start conversation
        </motion.button>
      </div>
    </motion.div>
  );
}
