"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentGlyph, CompanyGlyph } from "@/components/PathGlyph";
import markSrc from "@/public/brand/mingle-mark.jpg";

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

  const handleGetStarted = () => {
    if (!selected || leaving) return;
    setLeaving(true);
  };

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-5 py-10 sm:px-10 sm:py-16">
      {/* M mark, faint, in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] opacity-[0.07] sm:h-[680px] sm:w-[680px]"
      >
        <Image
          src={markSrc}
          alt=""
          fill
          className="object-contain blur-[1px]"
        />
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
            <MingleLogo variant="lockup" size={44} priority className="mb-12" />

            <h1 className="font-display text-[1.75rem] font-bold leading-tight text-mingle-white sm:text-5xl">
              Careers start with{" "}
              <span className="mingle-gradient-text">connection</span>
            </h1>

            <p className="mt-5 text-lg text-mingle-text-secondary">
              What brings you to mingle?
            </p>

            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
              {PATH_CARDS.map((card) => {
                const isSelected = selected === card.id;
                const Glyph = card.Glyph;
                return (
                  <motion.button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelected(card.id)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-start rounded-2xl border-2 bg-mingle-surface p-6 text-left transition-colors ${
                      isSelected
                        ? "border-mingle-purple shadow-[0_0_0_3px_rgba(115,98,226,0.25)]"
                        : "border-transparent hover:border-mingle-purple/60"
                    }`}
                  >
                    <span className="relative flex h-12 w-12 items-center justify-center">
                      <span
                        aria-hidden
                        className={`absolute h-12 w-12 rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple blur-lg transition-opacity ${
                          isSelected ? "opacity-40" : "opacity-0"
                        }`}
                      />
                      <Glyph active={isSelected} className="relative" />
                    </span>
                    <span className="mt-4 font-display text-base font-semibold text-mingle-white">
                      {card.title}
                    </span>
                    <span className="mt-1.5 text-sm text-mingle-text-secondary">
                      {card.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              type="button"
              disabled={!selected}
              onClick={handleGetStarted}
              whileHover={selected ? { scale: 1.03 } : undefined}
              whileTap={selected ? { scale: 0.97 } : undefined}
              className={`mt-10 w-full rounded-full px-8 py-4 font-display text-base font-semibold transition-colors sm:w-auto ${
                selected
                  ? "bg-mingle-cta text-mingle-white cursor-pointer"
                  : "cursor-not-allowed bg-mingle-surface text-mingle-text-secondary/50"
              }`}
            >
              Get Started
            </motion.button>
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
