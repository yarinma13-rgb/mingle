"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentCvField } from "@/components/profile/TalentCvField";
import { TalentPhotoField } from "@/components/profile/TalentPhotoField";
import { GenderField } from "@/components/profile/GenderField";
import {
  ProfileChipRow,
  ProfileSection,
} from "@/components/profile/ProfileSection";
import { RecommendationsList } from "@/components/recommendations/RecommendationsList";
import { RequestRecommendation } from "@/components/recommendations/RequestRecommendation";
import { personInitials, type Gender } from "@/lib/profile/avatar";
import type { ProfileState } from "@/lib/profile/persistence";
import {
  loadSubmittedRecommendations,
  type SubmittedRecommendation,
} from "@/lib/recommendations/persistence";
import type { Database } from "@/lib/supabase/types";

export function ProfilePreview({
  profile,
  userId,
  supabase,
  onCvChanged,
  onPhotoChanged,
  onGenderChanged,
  onEditStep,
}: {
  profile: ProfileState;
  userId: string | null;
  supabase: SupabaseClient<Database>;
  onCvChanged: (next: { cvPath: string | null; cvFileName: string | null }) => void;
  onPhotoChanged: (photo: string | null) => void;
  onGenderChanged: (gender: Gender) => void;
  onEditStep?: (step: number) => void;
}) {
  const initials = personInitials(profile.firstName, profile.lastName);
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const [recommendations, setRecommendations] = useState<SubmittedRecommendation[]>([]);

  useEffect(() => {
    if (!userId) return;
    void loadSubmittedRecommendations(supabase, userId)
      .then(setRecommendations)
      .catch(() => setRecommendations([]));
  }, [supabase, userId]);

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
          {userId ? (
            <TalentPhotoField
              variant="hero"
              supabase={supabase}
              userId={userId}
              photo={profile.profilePhoto}
              initials={initials}
              gender={profile.gender}
              onChanged={onPhotoChanged}
            />
          ) : null}
          <div>
            <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-mingle-text sm:text-3xl">
              {fullName || "Your name"}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-mingle-text-secondary">
              {profile.headline || "Your title"}
            </p>
            <p className="mt-1 text-xs font-medium text-mingle-text-secondary/90">
              {[profile.location, profile.industry].filter(Boolean).join(" · ")}
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

        <ProfileSection title="About you" onEdit={onEditStep ? () => onEditStep(1) : undefined}>
          <GenderField
            value={profile.gender}
            onChange={onGenderChanged}
          />
        </ProfileSection>

        <ProfileSection title="Experience" onEdit={onEditStep ? () => onEditStep(1) : undefined}>
          <p className="text-sm leading-relaxed text-mingle-text-secondary">
            {profile.currentRole}
            {profile.yearsExperience !== null &&
              ` · ${profile.yearsExperience} years experience`}
          </p>
        </ProfileSection>

        {userId && (
          <ProfileSection title="CV">
            <TalentCvField
              supabase={supabase}
              userId={userId}
              cvPath={profile.cvPath}
              cvFileName={profile.cvFileName}
              editable
              showLabel={false}
              onChanged={onCvChanged}
            />
          </ProfileSection>
        )}

        <ProfileSection
          title="What drives me"
          onEdit={onEditStep ? () => onEditStep(2) : undefined}
        >
          <ProfileChipRow items={profile.drives} />
        </ProfileSection>

        <ProfileSection
          title="How I work"
          onEdit={onEditStep ? () => onEditStep(3) : undefined}
        >
          <ProfileChipRow items={profile.workStyle} />
        </ProfileSection>

        <ProfileSection
          title="What I'm looking for"
          onEdit={onEditStep ? () => onEditStep(4) : undefined}
        >
          <ProfileChipRow items={profile.lookingFor} />
          {profile.maxCommuteKm ? (
            <p className="text-xs text-mingle-text-secondary">
              Willing to commute up to {profile.maxCommuteKm} km
            </p>
          ) : null}
        </ProfileSection>

        <ProfileSection title="Skills" onEdit={onEditStep ? () => onEditStep(5) : undefined}>
          <ProfileChipRow items={profile.skills} />
        </ProfileSection>

        <ProfileSection title="Recommendations">
          <RecommendationsList items={recommendations} />
          {userId ? (
            <div className={recommendations.length > 0 ? "mt-2" : undefined}>
              <RequestRecommendation />
            </div>
          ) : null}
        </ProfileSection>

        <ProfileSection
          title="Salary expectation"
          onEdit={onEditStep ? () => onEditStep(6) : undefined}
        >
          <p className="text-sm leading-relaxed text-mingle-text-secondary">
            {profile.salaryExpectation
              ? `${profile.salaryExpectation.toLocaleString("en-US")} ILS / month`
              : "Not set"}
          </p>
          <p className="text-xs text-mingle-text-secondary">
            (private — not shown to companies)
          </p>
        </ProfileSection>

        <ProfileSection
          title="Beyond the CV"
          onEdit={onEditStep ? () => onEditStep(7) : undefined}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-mingle-text-secondary">
            {profile.beyondCv}
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
