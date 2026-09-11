"use client";

import { useMemo, useSyncExternalStore } from "react";
import Image from "next/image";

const CONFETTI_COLORS = ["#F65F7C", "#D83A52", "#9D5CF2", "#0073EA", "#EA1E63", "#7B2FF7"];

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
  return Array.from({ length: 32 }, (_, i) => {
    const angleDeg = 15 + Math.random() * 150;
    const rad = (angleDeg * Math.PI) / 180;
    const distance = 70 + Math.random() * 130;
    const spin = Math.random() < 0.5 ? 1 : -1;
    const rotBurst = spin * (36 + Math.random() * 70);
    return {
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 5 + Math.random() * 5,
      delay: (i % 8) * 0.08,
      duration: 2.2 + Math.random() * 0.5,
      burstX: Math.cos(rad) * distance,
      burstY: -Math.sin(rad) * distance,
      fallY: 90 + Math.random() * 100,
      rotBurst,
      rotEnd: rotBurst + spin * (80 + Math.random() * 90),
    };
  });
}

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

export function LandingHeroMatch() {
  const reduceMotion = usePrefersReducedMotion();
  const confetti = useMemo(
    () => (reduceMotion ? [] : generateConfettiSpecs()),
    [reduceMotion],
  );

  return (
    <div className="landing-match-stage" aria-hidden="true">
      <div className="landing-match-glow" />

      <article className="landing-screen landing-screen-talent">
        <p className="landing-screen-kicker">Talent</p>
        <div className="landing-screen-top">
          <span className="landing-avatar landing-avatar-talent" />
          <p className="landing-screen-title">Product craft</p>
        </div>
        <ul className="landing-screen-tags">
          <li>Design systems</li>
          <li>B2B SaaS</li>
          <li>Remote first</li>
        </ul>
        <div className="landing-screen-bars">
          <i>
            <b className="fill-role" style={{ width: "90%" }} />
          </i>
          <i>
            <b className="fill-company" style={{ width: "82%" }} />
          </i>
          <i>
            <b className="fill-motivation" style={{ width: "94%" }} />
          </i>
        </div>
      </article>

      <div className="landing-match-center">
        <div className="landing-arrows">
          <span className="landing-arrow landing-arrow-ltr" />
          <span className="landing-arrow landing-arrow-rtl" />
        </div>

        <div className="landing-mingle-moment">
          <div className="landing-mingle-confetti" aria-hidden>
            {confetti.map((piece) => (
              <span
                key={piece.id}
                className="landing-mingle-confetti-piece"
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

          <div className="landing-mingle-core">
            <Image
              src="/mascot/mutual.png"
              alt=""
              width={120}
              height={120}
              className="landing-mascot-img"
              priority
            />
            <p className="landing-mascot-score">94</p>
            <p className="landing-mascot-label">It&apos;s a mingle</p>
          </div>
        </div>
      </div>

      <article className="landing-screen landing-screen-company">
        <p className="landing-screen-kicker">Company</p>
        <div className="landing-screen-top">
          <span className="landing-avatar landing-avatar-company" />
          <p className="landing-screen-title">Series A product team</p>
        </div>
        <ul className="landing-screen-tags">
          <li>Weekly shipping</li>
          <li>Tel Aviv</li>
          <li>Ownership</li>
        </ul>
        <div className="landing-screen-bars">
          <i>
            <b className="fill-role" style={{ width: "88%" }} />
          </i>
          <i>
            <b className="fill-company" style={{ width: "86%" }} />
          </i>
          <i>
            <b className="fill-motivation" style={{ width: "91%" }} />
          </i>
        </div>
      </article>
    </div>
  );
}
