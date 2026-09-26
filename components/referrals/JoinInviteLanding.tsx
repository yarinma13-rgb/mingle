"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MingleLogo } from "@/components/MingleLogo";
import { reportTalentReferralSignupStarted } from "@/lib/talent-referrals/client";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export function JoinInviteLanding() {
  const goSignup = () => {
    track(AnalyticsEvent.talentReferralCtaClicked, { cta: "join" });
    void reportTalentReferralSignupStarted();
  };

  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(236,72,153,0.12),transparent_50%),radial-gradient(ellipse_at_80%_10%,rgba(99,102,241,0.14),transparent_45%),radial-gradient(ellipse_at_50%_100%,rgba(59,130,246,0.1),transparent_40%)]"
      />
      <div className="relative mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="flex flex-col items-center text-center"
        >
          <MingleLogo variant="mark" size={44} className="mb-5" />
          <span className="mingle-gradient-text font-display text-[11px] font-semibold uppercase tracking-[0.18em]">
            mingle
          </span>
          <h1 className="mt-4 font-display text-[1.85rem] font-bold leading-tight tracking-tight text-mingle-text sm:text-4xl">
            You&apos;re invited to discover where you fit.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-mingle-text-secondary">
            A friend thought you&apos;d find relevant opportunities and matches
            on mingle. Build your profile and see for yourself.
          </p>

          <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
            <Link
              href="/auth?mode=signup&path=talent"
              onClick={goSignup}
              className="mingle-btn-primary w-full text-center"
            >
              Join mingle
            </Link>
            <Link
              href="/auth?mode=signin&path=talent"
              onClick={() =>
                track(AnalyticsEvent.talentReferralCtaClicked, {
                  cta: "signin",
                })
              }
              className="mingle-btn-tertiary w-full text-center"
            >
              I already have an account
            </Link>
          </div>

          <p className="mt-8 text-xs text-mingle-text-secondary/80">
            Free for candidates · Premium matching experience
          </p>
        </motion.div>
      </div>
    </main>
  );
}
