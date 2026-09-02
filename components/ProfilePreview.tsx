"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MingleLogo } from "@/components/MingleLogo";
import { TalentCvField } from "@/components/profile/TalentCvField";
import type { ProfileState } from "@/lib/profile/persistence";
import type { Database } from "@/lib/supabase/types";

function ChipRow({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-mingle-purple/15 px-3 py-1.5 text-xs font-medium text-mingle-white"
        >
          {item}
        </span>
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
      <h2 className="font-display text-sm font-semibold text-mingle-white">
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
}: {
  profile: ProfileState;
  userId: string | null;
  supabase: SupabaseClient<Database>;
  onCvChanged: (next: { cvPath: string | null; cvFileName: string | null }) => void;
}) {
  const initials =
    `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="flex min-h-screen flex-1 justify-center px-6 py-16 sm:px-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex w-full max-w-lg flex-col gap-6"
      >
        <div className="flex flex-col items-center text-center">
          <MingleLogo variant="mark" size={32} className="mb-4" />
          <span className="mingle-gradient-text font-display text-xs font-semibold uppercase tracking-[0.16em]">
            Your mingle profile
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 text-center">
          {profile.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.profilePhoto}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xl font-bold text-mingle-white">
              {initials || "?"}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-mingle-white">
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

        <Section title="Beyond the CV">
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.beyondCv}
          </p>
        </Section>

        <Link
          href="/dashboard"
          className="mt-2 rounded-full bg-mingle-cta px-8 py-3.5 text-center font-display text-sm font-semibold text-mingle-white"
        >
          Looks good
        </Link>
      </motion.div>
    </div>
  );
}
