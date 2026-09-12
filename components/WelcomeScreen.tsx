"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Figtree, Poppins } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentPathArt, CompanyPathArt } from "@/components/PathGlyph";

/**
 * Monday.com brand typography:
 * - Poppins for marketing titles / display
 * - Figtree for platform body, labels, and small copy
 */
const welcomeDisplay = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const welcomeBody = Figtree({
  subsets: ["latin", "latin-ext"],
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
  tint: string;
}[] = [
  {
    id: "talent",
    eyebrow: "For candidates",
    title: "Find roles that actually fit",
    description:
      "Set your preferences once. See clear Why this match — and only talk when interest is mutual.",
    Art: TalentPathArt,
    tint: "from-[#fff1f6] to-[#f3eeff]",
  },
  {
    id: "company",
    eyebrow: "For companies",
    title: "Meet people worth talking to",
    description:
      "Paste a role. Get a short explained list — Role, Human, and Motivation Fit — not another CV pile.",
    Art: CompanyPathArt,
    tint: "from-[#f1f4ff] to-[#eef0ff]",
  },
];

export function WelcomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Path | null>(null);
  const [leaving, setLeaving] = useState(false);

  const choosePath = (path: Path) => {
    if (leaving) return;
    setSelected(path);
    setLeaving(true);
  };

  return (
    <div
      className={`${welcomeBody.className} relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-16`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(246,95,124,0.12),transparent_36%),radial-gradient(circle_at_86%_18%,rgba(0,115,234,0.1),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(157,92,242,0.08),transparent_42%)]"
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
              className={`${welcomeDisplay.className} text-[2rem] font-bold leading-[1.12] tracking-[-0.014em] text-mingle-text sm:text-[2.75rem] sm:leading-[1.1]`}
            >
              The right people.{" "}
              <span className="mingle-gradient-text">Worth talking to.</span>
            </h1>

            <p className="mt-4 max-w-md text-[1.05rem] font-normal leading-[1.55] tracking-normal text-mingle-text-secondary sm:text-lg">
              Mutual career matching — clear reasons for both sides, before the
              first conversation.
            </p>

            <p className="mt-9 text-[0.9375rem] font-semibold tracking-normal text-mingle-text">
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
                      <span className="text-[13px] font-semibold tracking-[0.04em] text-mingle-purple">
                        {card.eyebrow}
                      </span>
                      <span
                        className={`${welcomeDisplay.className} mt-1.5 text-[1.25rem] font-semibold leading-snug tracking-[-0.005em] text-mingle-text`}
                      >
                        {card.title}
                      </span>
                      <span className="mt-1.5 text-sm font-normal leading-[1.55] tracking-normal text-mingle-text-secondary">
                        {card.description}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="mt-8 text-xs font-normal tracking-[0.01em] text-mingle-text-secondary">
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
