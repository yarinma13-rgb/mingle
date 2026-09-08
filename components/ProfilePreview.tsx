"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MingleLogo } from "@/components/MingleLogo";
import { MingleChip } from "@/components/MingleChip";
import { TalentCvField } from "@/components/profile/TalentCvField";
import { TalentPhotoField } from "@/components/profile/TalentPhotoField";
import { GenderField } from "@/components/profile/GenderField";
import { RecommendationsList } from "@/components/recommendations/RecommendationsList";
import { RequestRecommendation } from "@/components/recommendations/RequestRecommendation";
import { personInitials, type Gender } from "@/lib/profile/avatar";
import type { ProfileState } from "@/lib/profile/persistence";
import {
  loadSubmittedRecommendations,
  type SubmittedRecommendation,
} from "@/lib/recommendations/persistence";
import type { Database } from "@/lib/supabase/types";

function ChipRow({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <MingleChip key={item}>{item}</MingleChip>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-mingle-surface p-5">
      <h2 className="font-display text-sm font-semibold text-mingle-text">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function ProfilePreview({
  profile,
  userId,
  supabase,
  onCvChanged,
  onPhotoChanged,
  onGenderChanged,
}: {
  profile: ProfileState;
  userId: string | null;
  supabase: SupabaseClient<Database>;
  onCvChanged: (next: { cvPath: string | null; cvFileName: string | null }) => void;
  onPhotoChanged: (photo: string | null) => void;
  onGenderChanged: (gender: Gender) => void;
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
    <div className="flex min-h-screen flex-1 justify-center px-6 py-16 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col gap-6"
      >
        <div className="flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={40} className="mb-4" />
          <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
            Your mingle profile
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
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
            <h1 className="font-display text-2xl font-bold text-mingle-text">
              {fullName || "Your name"}
            </h1>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              {profile.headline || "Your title"}
            </p>
            <p className="mt-1 text-xs text-mingle-text-secondary">
              {[profile.location, profile.industry].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <Section title="About you">
          <GenderField
            value={profile.gender}
            onChange={onGenderChanged}
          />
        </Section>

        <Section title="Experience">
          <p className="text-sm text-mingle-text-secondary">
            {profile.currentRole}
            {profile.yearsExperience !== null &&
              ` · ${profile.yearsExperience} years experience`}
          </p>
        </Section>

        {userId && (
          <Section title="CV">
            <TalentCvField
              supabase={supabase}
              userId={userId}
              cvPath={profile.cvPath}
              cvFileName={profile.cvFileName}
              editable
              showLabel={false}
              onChanged={onCvChanged}
            />
          </Section>
        )}

        <Section title="What drives me">
          <ChipRow items={profile.drives} />
        </Section>

        <Section title="How I work">
          <ChipRow items={profile.workStyle} />
        </Section>

        <Section title="What I'm looking for">
          <ChipRow items={profile.lookingFor} />
        </Section>

        <Section title="Skills">
          <ChipRow items={profile.skills} />
        </Section>

        <Section title="Recommendations">
          <RecommendationsList items={recommendations} />
          {userId ? (
            <div className={recommendations.length > 0 ? "mt-2" : undefined}>
              <RequestRecommendation />
            </div>
          ) : null}
        </Section>

        {profile.salaryExpectation ? (
          <Section title="Salary expectation">
            <p className="text-sm text-mingle-text-secondary">
              Saved privately. Companies never see the number.
            </p>
          </Section>
        ) : null}

        <Section title="Beyond the CV">
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.beyondCv}
          </p>
        </Section>

        <Link
          href="/dashboard"
          className="mt-2 rounded-full bg-mingle-cta px-8 py-3.5 text-center font-display text-sm font-semibold text-white"
        >
          Looks good
        </Link>
      </motion.div>
    </div>
  );
}
