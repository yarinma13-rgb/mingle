"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { DEMO_CANDIDATES } from "@/lib/demo/data";
import { demoEase } from "@/lib/demo/motion";
import { useDemoPlayback } from "@/lib/demo/playback-context";

/**
 * Scene 02 — recruiter applicant deck. Information without understanding.
 */
export function ProblemScene() {
  const { elapsedMs, reducedMotion } = useDemoPlayback();
  const showSkillsLine = reducedMotion || elapsedMs >= 8500;
  const showRestLine = reducedMotion || elapsedMs >= 13500;

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-secondary">
            Open role · Senior Product Manager
          </p>
          <h2 className="mt-1 font-display text-[28px] font-bold tracking-tight text-mingle-text">
            247 applicants
          </h2>
        </div>
        <p className="text-sm text-mingle-text-secondary">
          Sorted by keyword relevance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_CANDIDATES.map((card, index) => (
          <motion.article
            key={card.userId}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : 0.12 + index * 0.12,
              duration: 0.55,
              ease: demoEase,
            }}
            className="rounded-[18px] border border-mingle-border bg-mingle-surface p-4 shadow-mingle"
          >
            <div className="flex items-start gap-3">
              <Avatar
                photo={card.photo}
                initials={card.initials}
                gender={card.gender}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-bold text-mingle-text">
                  {card.name}
                </p>
                <p className="truncate text-[13px] text-mingle-text-secondary">
                  {card.headline}
                </p>
                <p className="mt-0.5 truncate text-[12px] text-mingle-text-muted">
                  {card.location}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(index === 0
                ? ["Product strategy", "Analytics", "Roadmapping"]
                : index === 1
                  ? ["Figma", "Research", "Systems"]
                  : ["Stakeholder mgmt", "SQL", "Growth"]
              ).map((skill) => (
                <MingleChip key={skill} tone={index % 2 === 0 ? "purple" : "blue"}>
                  {skill}
                </MingleChip>
              ))}
            </div>
            <p className="mt-3 line-clamp-2 text-[12px] leading-relaxed text-mingle-text-secondary">
              {index === 0
                ? "6 years B2B SaaS · activation ownership · Tel Aviv"
                : index === 1
                  ? "7 years product design · Berlin · open to EU remote"
                  : "Product experience across marketplace and SaaS teams"}
            </p>
          </motion.article>
        ))}
      </div>

      {/* Editorial overlays — problem thesis */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-3 px-4">
        <motion.p
          data-demo-target="problem-overlay-skills"
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: showSkillsLine ? 1 : 0,
            y: showSkillsLine ? 0 : 8,
          }}
          transition={{ duration: 0.55, ease: demoEase }}
          className="rounded-[12px] border border-mingle-border bg-white/95 px-5 py-3 font-display text-base font-semibold text-mingle-text shadow-mingle backdrop-blur sm:text-lg"
        >
          Skills tell part of the story.
        </motion.p>
        <motion.p
          data-demo-target="problem-overlay-rest"
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: showRestLine ? 1 : 0,
            y: showRestLine ? 0 : 8,
          }}
          transition={{ duration: 0.55, ease: demoEase }}
          className="rounded-[12px] border border-mingle-border bg-white/95 px-5 py-3 font-display text-base font-semibold text-mingle-text-secondary shadow-mingle backdrop-blur sm:text-lg"
        >
          But what about the rest?
        </motion.p>
      </div>
    </div>
  );
}
