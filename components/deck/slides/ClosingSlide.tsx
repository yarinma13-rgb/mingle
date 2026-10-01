"use client";

import { MingleLogo } from "@/components/MingleLogo";

export function ClosingSlide() {
  return (
    <div className="deck-slide-inner relative flex h-full flex-col items-center justify-center overflow-hidden text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--deck-soft-gradient)" }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <MingleLogo size={72} priority />
        <p className="mt-8 font-display text-[2.6rem] font-bold tracking-[-0.03em] text-[color:var(--deck-dark)] sm:text-[3.2rem]">
          mingle
        </p>
        <p className="mt-3 font-display text-2xl font-semibold deck-gradient-text sm:text-3xl">
          Beyond the match.
        </p>
        <p className="mt-8 max-w-xl text-lg font-medium leading-relaxed text-[color:var(--deck-secondary)]">
          The future of hiring starts before the hire.
        </p>
      </div>
    </div>
  );
}
