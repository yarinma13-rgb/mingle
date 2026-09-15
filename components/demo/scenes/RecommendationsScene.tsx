"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import { RecommendationStars } from "@/components/recommendations/RecommendationStars";
import { ProfileSection } from "@/components/profile/ProfileSection";
import { DEMO_EMMA, DEMO_RECOMMENDATIONS } from "@/lib/demo/data";

export function RecommendationsScene() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
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
        <div className="flex flex-col gap-4">
          {DEMO_RECOMMENDATIONS.map((item, index) => (
            <article
              key={item.id}
              data-demo-target={index === 0 ? "rec-first" : undefined}
              className="flex flex-col gap-2"
            >
              <div data-demo-target={index === 0 ? "rec-stars" : undefined}>
                <RecommendationStars rating={item.rating} />
              </div>
              <p className="text-sm font-medium text-mingle-text">
                {item.recommenderName}
              </p>
              <p className="text-xs text-mingle-text-secondary">
                Verified via LinkedIn
              </p>
              {item.body ? (
                <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
                  {item.body}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </ProfileSection>
    </motion.div>
  );
}
