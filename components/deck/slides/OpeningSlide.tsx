"use client";

import { MingleLogo } from "@/components/MingleLogo";
import { FounderPhoto } from "@/components/deck/FounderPhoto";

export function OpeningSlide() {
  return (
    <div className="deck-slide-inner relative flex h-full flex-col justify-between overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{ background: "var(--deck-soft-gradient)" }}
      />
      <div className="relative z-10 flex items-start justify-between gap-6">
        <MingleLogo size={64} priority />
        <div className="flex items-center gap-4">
          <div dir="rtl" className="text-right">
            <p className="font-display text-sm font-bold text-[color:var(--deck-dark)]">
              ירין כהן
            </p>
            <p className="text-xs font-medium text-[color:var(--deck-secondary)]">
              Founder
            </p>
          </div>
          <FounderPhoto size={88} />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="font-display text-[2.8rem] font-bold tracking-[-0.03em] text-[color:var(--deck-dark)] sm:text-[3.4rem]">
          mingle
        </p>
        <p
          className="mt-3 font-display text-2xl font-semibold tracking-[-0.02em] deck-gradient-text sm:text-3xl"
          dir="ltr"
        >
          Beyond the match.
        </p>
        <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-[color:var(--deck-secondary)]">
          שכבת הקשר בין אנשים לחברות, לפני שהחיבור הופך להעסקה.
        </p>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4" dir="ltr">
        <p className="text-sm font-medium text-[color:var(--deck-secondary)]">
          Future of Work · Mutual Matching
        </p>
        <p className="text-xs font-medium text-[color:var(--deck-secondary)]">
          SaaS · Seed stage
        </p>
      </div>
    </div>
  );
}
