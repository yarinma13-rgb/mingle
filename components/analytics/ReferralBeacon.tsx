"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { stashReferralId } from "@/lib/referrals/client";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Stash a referral id from /welcome?ref=... so it survives through
 * signup — attribution itself happens right after auth succeeds
 * (see reportReferralAttribution in AuthForm's goAfterAuth).
 */
export function ReferralBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const referralId = params.get("ref");
    if (!referralId) return;
    stashReferralId(referralId);
    track(AnalyticsEvent.referralStarted, { referral_id: referralId });
  }, [params]);

  return null;
}
