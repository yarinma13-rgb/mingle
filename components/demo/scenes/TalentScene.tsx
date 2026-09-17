"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MingleChip } from "@/components/MingleChip";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { DEMO_TALENT_COMPANIES } from "@/lib/demo/data";

/**
 * Talent Discover — company opportunity cards, mirroring DiscoveryScreen
 * company-card language without supabase mutations.
 */
export function TalentScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto flex w-full max-w-4xl flex-col gap-5"
    >
      <p className="text-sm text-mingle-text-secondary">
        Opportunities ranked by role fit, human fit, and motivation — not
        keyword dumps.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {DEMO_TALENT_COMPANIES.map((company, index) => (
          <article
            key={company.userId}
            data-demo-target={index === 0 ? "talent-card" : undefined}
            className={`flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle ${
              index === 0 ? "demo-highlight ring-1 ring-mingle-accent-purple/20" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar
                initials={company.companyName.slice(0, 2).toUpperCase()}
                size="lg"
                shape="soft"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold text-mingle-text">
                  {company.companyName}
                </p>
                <p className="text-xs text-mingle-text-secondary">
                  {company.roleTitle} · {company.location}
                </p>
                <p className="mt-1 text-[11px] text-mingle-text-muted">
                  {company.industry}
                </p>
              </div>
              <div data-demo-target={index === 0 ? "talent-score" : undefined}>
                <MatchScoreRing score={company.matchScore} size={56} showLabel />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-mingle-text-secondary">
              {company.about}
            </p>

            <div className="flex flex-wrap gap-2">
              {company.tags.map((tag) => (
                <MingleChip key={tag}>{tag}</MingleChip>
              ))}
            </div>

            <div className="mt-1 flex gap-2">
              <div
                data-demo-target={index === 0 ? "talent-interested" : undefined}
                className="flex-1 rounded-full bg-mingle-cta py-2.5 text-center text-xs font-semibold text-white"
              >
                Interested
              </div>
              <div className="flex-1 rounded-full border border-mingle-border bg-mingle-white py-2.5 text-center text-xs font-semibold text-mingle-text">
                Pass
              </div>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
}
