"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { stashReferralId } from "@/lib/referrals/client";

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
  }, [params]);

  return null;
}
