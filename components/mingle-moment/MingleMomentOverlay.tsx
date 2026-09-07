"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MingleLogo } from "@/components/MingleLogo";
// Mascot temporarily removed from this screen — see components/MascotMagnet.tsx,
// component and pose assets are kept, just not rendered here for now.

const CONFETTI_COLORS = [
  "#F65F7C",
  "#D83A52",
  "#9D5CF2",
  "#0073EA",
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

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(true);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(media.matches);
    const onChange = () => setReduce(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

function useConfettiSpecs(enabled: boolean): ConfettiSpec[] {
  const [specs, setSpecs] = useState<ConfettiSpec[]>([]);
  useEffect(() => {
    if (!enabled) {
      setSpecs([]);
      return;
    }
    Promise.resolve().then(() => setSpecs(generateConfettiSpecs()));
  }, [enabled]);
  return specs;
}

export function MingleMomentOverlay({
  matchName,
  connectionId,
  onClose,
}: {
  matchName: string;
  matchUserId?: string;
  connectionId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();
  const confetti = useConfettiSpecs(!reduceMotion);

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
    const dest = connectionId
      ? `/conversations/${connectionId}`
      : "/conversations";
    router.push(dest);
    onClose();
  };

  return (
    <div className="mingle-moment-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-mingle-bg px-6">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 z-[2] flex h-9 w-9 items-center justify-center rounded-full text-mingle-text-secondary transition-colors hover:text-mingle-text"
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
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className="absolute h-40 w-40 rounded-full bg-mingle-blue/15 blur-3xl"
          />
          <MingleLogo variant="mark" size={88} className="relative" priority />
        </div>

        <h1 className="mt-6 max-w-full px-1 font-display text-3xl font-bold text-mingle-text sm:text-5xl">
          It&rsquo;s a mingle
        </h1>

        <p className="mt-4 max-w-xs text-sm text-mingle-text-secondary">
          You and {matchName} both want to get to know each other.
        </p>

        <button
          type="button"
          onClick={startConversation}
          className="mt-8 w-full max-w-xs rounded-full bg-mingle-cta px-8 py-3.5 font-display text-sm font-semibold text-white"
        >
          Start conversation
        </button>
      </div>
    </div>
  );
}
