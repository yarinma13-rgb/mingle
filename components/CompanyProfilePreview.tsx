"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";

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

export function CompanyProfilePreview({
  profile,
}: {
  profile: CompanyProfileState;
}) {
  const initial = profile.companyName.charAt(0).toUpperCase();

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
          {profile.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.logo}
              alt=""
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-mingle-pink to-mingle-purple font-display text-xl font-bold text-mingle-white">
              {initial || "?"}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-mingle-white">
              {profile.companyName || "Your company"}
            </h1>
            <p className="mt-1 text-sm text-mingle-text-secondary">
              {profile.mission || "Your mission"}
            </p>
            <p className="mt-1 text-xs text-mingle-text-secondary">
              {[profile.industry, profile.location]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <Section title="About">
          <p className="text-sm text-mingle-text-secondary">
            {[profile.companyStage, profile.companySize]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </Section>

        <Section title="How we work">
          <ChipRow items={profile.workEnvironment} />
        </Section>

        <Section title="What we value">
          <ChipRow items={profile.values} />
        </Section>

        <Section title="What we're looking for">
          <ChipRow items={profile.lookingFor} />
        </Section>

        <Section title="Who thrives here">
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.whoThrivesHere}
          </p>
        </Section>

        <Section title="What we're building">
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.description}
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
