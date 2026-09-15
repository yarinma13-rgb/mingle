"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/Avatar";
import {
  ProfileChipRow,
  ProfileSection,
} from "@/components/profile/ProfileSection";
import { scoreChipClass, scoreTextClass } from "@/lib/matching/score-tone";
import {
  DEMO_EMMA,
  DEMO_EMMA_MATCH_REPORT,
  DEMO_EMMA_SECTIONS,
  DEMO_WHAT_TO_EXPLORE,
} from "@/lib/demo/data";

/**
 * Read-only candidate profile layout mirroring ProfileDetailShell —
 * no Supabase mutations, safe for screen recording.
 */
export function ProfileScene({ highlight }: { highlight?: "sections" | "all" }) {
  const report = DEMO_EMMA_MATCH_REPORT;
  const sections =
    highlight === "sections"
      ? DEMO_EMMA_SECTIONS
      : DEMO_EMMA_SECTIONS.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] lg:items-start"
    >
      <aside className="rounded-3xl border border-mingle-border bg-mingle-surface p-5 shadow-mingle">
        <p className="mingle-gradient-text text-center font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
          Talent profile
        </p>
        <div
          data-demo-target="profile-avatar"
          className="mt-4 flex flex-col items-center gap-3 text-center"
        >
          <Avatar
            photo={DEMO_EMMA.photo}
            initials={DEMO_EMMA.initials}
            gender={DEMO_EMMA.gender}
            size="hero"
          />
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-mingle-text">
              {DEMO_EMMA.name}
            </h2>
            <p className="mt-1.5 text-sm text-mingle-text-secondary">
              {DEMO_EMMA.headline}
            </p>
            <p className="mt-1 text-xs font-medium text-mingle-text-secondary/90">
              {DEMO_EMMA.location}
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${scoreChipClass(report.overall)}`}
          >
            <span className={scoreTextClass(report.overall)}>
              {report.overall}% relevance
            </span>
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-2">
          <div
            data-demo-target="profile-connect"
            className="rounded-full bg-mingle-cta px-6 py-3 text-center font-display text-sm font-semibold text-white"
          >
            Start a connection
          </div>
          <div className="rounded-full border border-mingle-border bg-mingle-white px-6 py-3 text-center font-display text-sm font-semibold text-mingle-text">
            Save for later
          </div>
        </div>
      </aside>

      <div className="flex flex-col gap-4">
        {sections.map((section, index) => {
          const chips = section.chips?.filter(Boolean) ?? [];
          const text = section.text?.trim() ?? "";
          return (
            <ProfileSection
              key={section.title}
              title={section.title}
              elevated={index % 2 === 1}
            >
              <div
                data-demo-target={
                  section.title === "Values that drive me"
                    ? "profile-values"
                    : undefined
                }
              >
                {chips.length > 0 ? <ProfileChipRow items={chips} /> : null}
                {text ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-mingle-text-secondary">
                    {text}
                  </p>
                ) : null}
              </div>
            </ProfileSection>
          );
        })}

        <ProfileSection title="What to explore">
          <ul className="flex flex-col gap-2">
            {DEMO_WHAT_TO_EXPLORE.map((prompt) => (
              <li
                key={prompt}
                className="flex gap-2 text-sm leading-relaxed text-mingle-text-secondary"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mingle-purple"
                />
                {prompt}
              </li>
            ))}
          </ul>
        </ProfileSection>
      </div>
    </motion.div>
  );
}
