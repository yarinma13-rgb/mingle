"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentGlyph, CompanyGlyph } from "@/components/PathGlyph";

type Path = "talent" | "company";

const PATH_CARDS: {
  id: Path;
  title: string;
  description: string;
  Glyph: typeof TalentGlyph;
}[] = [
  {
    id: "talent",
    title: "I'm looking for my next opportunity",
    description: "Connect with companies that match your goals.",
    Glyph: TalentGlyph,
  },
  {
    id: "company",
    title: "I'm looking for talent",
    description: "Discover people who fit your team.",
    Glyph: CompanyGlyph,
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
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] opacity-[0.12] sm:h-[680px] sm:w-[680px]"
      >
        <MingleLogo variant="mark" size={192} alt="" />
      </div>

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
            className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
          >
            <MingleLogo variant="lockup" size={70} priority className="mb-12" />

            <h1 className="font-display text-[1.75rem] font-bold leading-tight text-mingle-text sm:text-5xl">
              Careers start with{" "}
              <span className="mingle-gradient-text">connection</span>
            </h1>

            <p className="mt-5 text-lg text-mingle-text-secondary">
              What brings you to mingle?
            </p>

            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
              {PATH_CARDS.map((card) => {
                const Glyph = card.Glyph;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={() => choosePath(card.id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex min-w-0 flex-col items-start rounded-2xl border border-mingle-border bg-mingle-white p-6 text-left shadow-mingle transition-colors hover:border-mingle-blue/60"
                  >
                    <span className="relative flex h-12 w-12 items-center justify-center">
                      <Glyph className="relative" />
                    </span>
                    <span className="mt-4 font-display text-base font-semibold text-mingle-text">
                      {card.title}
                    </span>
                    <span className="mt-1.5 text-sm text-mingle-text-secondary">
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
