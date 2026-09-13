"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Figtree, Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentPathArt, CompanyPathArt } from "@/components/PathGlyph";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * monday.com typography scale (marketing site):
 * Display → Poppins · Body / labels / legal → Figtree
 * Sizes/weights match monday display-md, title-md, body-lg/sm, caption, legal.
 */
const welcomeDisplay = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
  display: "swap",
});

const welcomeBody = Figtree({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

type Path = "talent" | "company";

const PATH_CARDS: {
  id: Path;
  eyebrow: string;
  title: string;
  description: string;
  Art: typeof TalentPathArt;
  tint: string;
}[] = [
  {
    id: "talent",
    eyebrow: "For candidates",
    title: "Roles that actually fit",
    description:
      "Clear matches with real reasons. Talk only when interest is mutual.",
    Art: TalentPathArt,
    tint: "from-[#f4f0ff] to-[#eef2ff]",
  },
  {
    id: "company",
    eyebrow: "For companies",
    title: "People worth talking to",
    description:
      "Paste a role. Get a short explained list, not another CV pile.",
    Art: CompanyPathArt,
    tint: "from-[#eef5ff] to-[#f0f2ff]",
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
      className={`${welcomeBody.className} relative flex flex-1 items-center justify-center overflow-hidden bg-[#f5f8ff] px-5 py-10 sm:px-10 sm:py-16`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(140,110,255,0.11),transparent_44%),radial-gradient(circle_at_90%_12%,rgba(150,200,255,0.22),transparent_42%),radial-gradient(circle_at_48%_100%,rgba(110,150,255,0.1),transparent_48%),radial-gradient(circle_at_70%_55%,rgba(220,235,255,0.55),transparent_52%)]"
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

            {/* display-md → display-lg: Poppins 36/700 → 48/700 */}
            <h1
              className={`${welcomeDisplay.className} flex flex-col items-center text-[36px] font-bold leading-[1.18] tracking-[-0.01em] text-mingle-text sm:text-[48px] sm:leading-[1.1] sm:tracking-[-0.014em]`}
            >
              <span>The right people.</span>
              <span className="mingle-gradient-text">Worth talking to.</span>
            </h1>

            {/* body-lg: Figtree 18/400 */}
            <p className="mt-4 max-w-md text-[18px] font-normal leading-[1.55] text-mingle-text-secondary">
              Mutual career matching with clear reasons for both sides, before
              the first conversation.
            </p>

            {/* label-md: Figtree 16/600 */}
            <p className="mt-9 text-[16px] font-semibold leading-[1.4] text-mingle-text">
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
                    className="group flex min-w-0 flex-col items-stretch overflow-hidden rounded-[24px] border border-mingle-border/70 bg-white text-left shadow-[0_14px_36px_rgba(45,27,78,0.07)] transition-colors hover:border-mingle-purple/35"
                  >
                    <div
                      className={`flex h-[132px] items-center justify-center bg-gradient-to-br ${card.tint}`}
                    >
                      <Art />
                    </div>
                    <div className="flex flex-col px-5 pb-5 pt-4">
                      {/* caption: Figtree 13/600 / 0.04em */}
                      <span className="text-[13px] font-semibold leading-[1.4] tracking-[0.04em] text-mingle-purple">
                        {card.eyebrow}
                      </span>
                      {/* title-md: Poppins 22/600 */}
                      <span
                        className={`${welcomeDisplay.className} mt-1.5 text-[22px] font-semibold leading-[1.3] tracking-normal text-mingle-text`}
                      >
                        {card.title}
                      </span>
                      {/* body-sm: Figtree 14/400 */}
                      <span className="mt-1.5 text-[14px] font-normal leading-[1.5] text-mingle-text-secondary">
                        {card.description}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* legal: Figtree 12/400 / 0.01em */}
            <p className="mt-8 text-[12px] font-normal leading-[1.4] tracking-[0.01em] text-mingle-text-secondary">
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
