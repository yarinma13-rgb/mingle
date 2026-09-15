"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { RecommendationsList } from "@/components/recommendations/RecommendationsList";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DEMO_EMMA, DEMO_RECOMMENDATIONS } from "@/lib/demo/data";

export function RecommendationsScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-2xl flex-col gap-5"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <Avatar
          photo={DEMO_EMMA.photo}
          initials={DEMO_EMMA.initials}
          gender={DEMO_EMMA.gender}
          size="lg"
        />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mingle-text-muted">
            On {DEMO_EMMA.name}&apos;s profile
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-mingle-text">
            Recommendations
          </h2>
          <p className="text-sm text-mingle-text-secondary">
            Context from people who have worked with them.
          </p>
        </div>
      </div>

      <ProfileSection title="Recommendations" elevated>
        <RecommendationsList items={DEMO_RECOMMENDATIONS} />
      </ProfileSection>
    </motion.div>
  );
}
