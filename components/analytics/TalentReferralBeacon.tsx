"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  reportTalentReferralOpen,
  stashTalentRefCode,
} from "@/lib/talent-referrals/client";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Stash a talent invite code from /join?ref=... so it survives through
 * signup — attribution happens after auth (reportTalentReferralAttribution).
 */
export function TalentReferralBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("ref")?.trim().toLowerCase() ?? "";
    if (!/^[a-z0-9]{6,12}$/.test(code)) return;
    stashTalentRefCode(code);
    track(AnalyticsEvent.talentReferralLinkViewed, { code });
    void reportTalentReferralOpen(code);
  }, [params]);

  return null;
}
