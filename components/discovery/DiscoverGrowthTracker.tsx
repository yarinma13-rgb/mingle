"use client";

import { useEffect, useRef } from "react";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import type { UserType } from "@/lib/supabase/types";

/** Fires discover_viewed once per mount (page load). */
export function DiscoverGrowthTracker({ userType }: { userType: UserType }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(AnalyticsEvent.discoverViewed, { user_type: userType });
  }, [userType]);
  return null;
}
