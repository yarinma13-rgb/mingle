"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { Avatar } from "@/components/Avatar";
import {
  ProfileChipRow,
  ProfileSection,
} from "@/components/profile/ProfileSection";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import { companyInitials } from "@/lib/profile/avatar";

export function CompanyProfilePreview({
  profile,
  onEditStep,
}: {
  profile: CompanyProfileState;
  onEditStep?: (step: number) => void;
}) {
  const initials = companyInitials(profile.companyName);

  return (
    <div className="flex min-h-screen flex-1 justify-center px-5 py-12 sm:px-10 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col gap-6"
      >
        <div className="flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={40} className="mb-4" />
          <span className="mingle-gradient-text font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
            Your mingle profile
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <Avatar
            photo={profile.logo}
            initials={initials}
            size="hero"
            shape="soft"
          />
          <div>
            <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-mingle-text sm:text-3xl">
              {profile.companyName || "Your company"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-mingle-text-secondary">
              {profile.mission || "Your mission"}
            </p>
            <p className="mt-1 text-xs font-medium text-mingle-text-secondary/90">
              {[profile.industry, profile.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {onEditStep ? (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="mt-2 text-xs font-semibold text-mingle-blue transition-colors hover:text-mingle-cta"
              >
                Edit
              </button>
            ) : null}
          </div>
        </div>

        <ProfileSection title="About" onEdit={onEditStep ? () => onEditStep(1) : undefined}>
          <p className="text-sm leading-relaxed text-mingle-text-secondary">
            {[profile.companyStage, profile.companySize]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </ProfileSection>

        <ProfileSection
          title="How we work"
          onEdit={onEditStep ? () => onEditStep(2) : undefined}
        >
          <ProfileChipRow items={profile.workEnvironment} />
        </ProfileSection>

        <ProfileSection
          title="What we value"
          onEdit={onEditStep ? () => onEditStep(3) : undefined}
        >
          <ProfileChipRow items={profile.values} />
        </ProfileSection>

        <ProfileSection
          title="What we're looking for"
          onEdit={onEditStep ? () => onEditStep(4) : undefined}
        >
          <ProfileChipRow items={profile.lookingFor} />
        </ProfileSection>

        <ProfileSection
          title="Who thrives here"
          onEdit={onEditStep ? () => onEditStep(5) : undefined}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-mingle-text-secondary">
            {profile.whoThrivesHere}
          </p>
        </ProfileSection>

        <ProfileSection
          title="What we're building"
          onEdit={onEditStep ? () => onEditStep(5) : undefined}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-mingle-text-secondary">
            {profile.description}
          </p>
        </ProfileSection>

        <Link
          href="/dashboard"
          className="mt-2 rounded-full bg-mingle-cta px-8 py-3.5 text-center font-display text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Looks good
        </Link>
      </motion.div>
    </div>
  );
}
