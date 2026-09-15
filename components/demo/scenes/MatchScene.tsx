"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { MatchReportBody } from "@/components/matching/MatchReport";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DEMO_EMMA, DEMO_EMMA_MATCH_REPORT, DEMO_ROLE } from "@/lib/demo/data";

export function MatchScene() {
  const report = DEMO_EMMA_MATCH_REPORT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-3xl flex-col gap-5"
    >
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <Avatar
          photo={DEMO_EMMA.photo}
          initials={DEMO_EMMA.initials}
          gender={DEMO_EMMA.gender}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
            Relevance for {DEMO_ROLE.title}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mingle-text">
            {DEMO_EMMA.name}
          </h2>
          <p className="text-sm text-mingle-text-secondary">
            {DEMO_EMMA.headline} · {DEMO_EMMA.location}
          </p>
        </div>
        <MatchScoreRing score={report.overall} size={72} showLabel />
      </div>

      <ProfileSection title="Match Report">
        <MatchReportBody report={report} />
      </ProfileSection>
    </motion.div>
  );
}
