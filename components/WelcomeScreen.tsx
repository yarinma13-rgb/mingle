"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Outfit, Manrope } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentPathArt, CompanyPathArt } from "@/components/PathGlyph";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

const welcomeDisplay = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const welcomeBody = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

type Path = "talent" | "company";

const PATH_CARDS: {
  id: Path;
  eyebrow: string;
  title: string;
  description: string;
  Art: typeof TalentPathArt;
}[] = [
  {
    id: "talent",
    eyebrow: "For you",
    title: "Find roles that actually fit",
    description:
      "Set your preferences once. See clear Why this match — and only talk when interest is mutual.",
    Art: TalentPathArt,
  },
  {
    id: "company",
    eyebrow: "For hiring teams",
    title: "Meet people worth talking to",
    description:
      "Paste a role. Get a short explained list — Role, Human, and Motivation Fit — not another CV pile.",
    Art: CompanyPathArt,
  },
];

export function WelcomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Path | null>(null);
  const [leaving, setLeaving] = useState(false);

  const choosePath = (path: Path) => {
    if (leaving) return;
    track(AnalyticsEvent.welcomePathSelected, { path });
    setSelected(path);
    setLeaving(true);
  };

  return (
    <div
      className={`${welcomeBody.className} relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-16`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(246,95,124,0.12),transparent_34%),radial-gradient(circle_at_86%_18%,rgba(0,115,234,0.12),transparent_32%),radial-gradient(circle_at_50%_100%,rgba(157,92,242,0.1),transparent_40%)]"
      />

      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (selected) router.push(`/auth?path=${selected}`);
        }}
      >
        {!leaving && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center"
          >
            <MingleLogo variant="lockup" size={64} priority className="mb-10" />

            <h1
              className={`${welcomeDisplay.className} text-[1.85rem] font-bold leading-[1.12] tracking-[-0.04em] text-mingle-text sm:text-[2.75rem]`}
            >
              The right people.{" "}
              <span className="mingle-gradient-text">Worth talking to.</span>
            </h1>

            <p className="mt-4 max-w-md text-base font-medium text-mingle-text-secondary sm:text-lg">
              Mutual career matching — clear reasons for both sides, before the
              first conversation.
            </p>

            <p
              className={`${welcomeDisplay.className} mt-8 text-sm font-semibold tracking-[-0.02em] text-mingle-text`}
            >
              Choose how you start
            </p>

            <div className="mt-4 grid w-full gap-4 sm:grid-cols-2">
              {PATH_CARDS.map((card) => {
                const Art = card.Art;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={() => choosePath(card.id)}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.985 }}
                    className="group flex min-w-0 flex-col items-stretch overflow-hidden rounded-[22px] border border-mingle-border/80 bg-white/90 p-5 text-left shadow-[0_12px_32px_rgba(45,27,78,0.06)] backdrop-blur-sm transition-colors hover:border-mingle-purple/35"
                  >
                    <div className="flex h-[84px] items-center justify-center rounded-2xl bg-[linear-gradient(160deg,#f7f4ff_0%,#eef5ff_100%)]">
                      <Art />
                    </div>
                    <span className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-mingle-purple">
                      {card.eyebrow}
                    </span>
                    <span
                      className={`${welcomeDisplay.className} mt-1.5 text-[1.05rem] font-bold leading-snug tracking-[-0.03em] text-mingle-text`}
                    >
                      {card.title}
                    </span>
                    <span className="mt-1.5 text-sm leading-relaxed text-mingle-text-secondary">
                      {card.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <p className="mt-8 text-xs text-mingle-text-secondary">
              <Link href="/legal/terms" className="underline underline-offset-2">
                Terms of Service
              </Link>
              {" · "}
              <Link href="/legal/privacy" className="underline underline-offset-2">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
