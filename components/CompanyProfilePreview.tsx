"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { MingleChip } from "@/components/MingleChip";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import { companyInitials } from "@/lib/profile/avatar";

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
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-mingle-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold text-mingle-text">
          {title}
        </h2>
        {onEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold text-mingle-blue"
          >
            Edit
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

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
              className="h-24 w-24 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-mingle-accent-purple font-display text-xl font-bold text-white">
              {initials}
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-bold text-mingle-text">
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
            {onEditStep ? (
              <button
                type="button"
                onClick={() => onEditStep(1)}
                className="mt-2 text-xs font-semibold text-mingle-blue"
              >
                Edit
              </button>
            ) : null}
          </div>
        </div>

        <Section title="About" onEdit={onEditStep ? () => onEditStep(1) : undefined}>
          <p className="text-sm text-mingle-text-secondary">
            {[profile.companyStage, profile.companySize]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </Section>

        <Section
          title="How we work"
          onEdit={onEditStep ? () => onEditStep(2) : undefined}
        >
          <ChipRow items={profile.workEnvironment} />
        </Section>

        <Section
          title="What we value"
          onEdit={onEditStep ? () => onEditStep(3) : undefined}
        >
          <ChipRow items={profile.values} />
        </Section>

        <Section
          title="What we're looking for"
          onEdit={onEditStep ? () => onEditStep(4) : undefined}
        >
          <ChipRow items={profile.lookingFor} />
        </Section>

        <Section
          title="Who thrives here"
          onEdit={onEditStep ? () => onEditStep(5) : undefined}
        >
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.whoThrivesHere}
          </p>
        </Section>

        <Section
          title="What we're building"
          onEdit={onEditStep ? () => onEditStep(5) : undefined}
        >
          <p className="whitespace-pre-wrap text-sm text-mingle-text-secondary">
            {profile.description}
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
