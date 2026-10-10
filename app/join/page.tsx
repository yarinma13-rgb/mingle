import { Suspense } from "react";
import { TalentReferralBeacon } from "@/components/analytics/TalentReferralBeacon";
import { JoinInviteLanding } from "@/components/referrals/JoinInviteLanding";
import { redirectIfAuthenticated } from "@/lib/auth/redirect-if-authed";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join mingle",
  description:
    "You've been invited to mingle — discover where you actually fit.",
};

export default async function JoinPage() {
  await redirectIfAuthenticated();
  return (
    <>
      <Suspense fallback={null}>
        <TalentReferralBeacon />
      </Suspense>
      <JoinInviteLanding />
    </>
  );
}
