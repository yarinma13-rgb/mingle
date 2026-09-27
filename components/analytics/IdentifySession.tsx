"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { identifyUser, getFirstTouchAttribution, track } from "@/lib/analytics/track";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { reportInterestAttribution } from "@/lib/outbound-interest/client";
import { reportTalentReferralAttribution } from "@/lib/talent-referrals/client";
import { readStashedReferralId } from "@/lib/referrals/client";
import { mapAcquisitionChannel } from "@/lib/analytics/acquisition-channel";
import type { UserType } from "@/lib/supabase/types";

const STORAGE_KEY = "mingle_ph_identified_user_id";
const RETURNING_SESSION_FLAG_KEY = "mingle_returning_session_sent";
const RETURNING_SESSION_MIN_DAYS = 7;

/**
 * Safety net for auth paths that never run client JS between success and
 * landing on a page — Google OAuth and email-confirmation links both finish
 * with a server-side redirect (app/auth/callback, app/auth/confirm), so
 * there's no moment in those flows to call posthog.identify() directly.
 * Mounted once in the root layout, this catches every authenticated session
 * on first client render and links it to PostHog's first-touch UTM data
 * (merged in by identifyUser), regardless of which auth path was used.
 *
 * Also attributes outbound interest tokens → user_type (talent/company).
 */
export function IdentifySession() {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const alreadyIdentified = window.localStorage.getItem(STORAGE_KEY);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled || !user) return;

        let userType: UserType | null = null;
        const { data: profile } = await supabase
          .from("users")
          .select("user_type, created_at")
          .eq("id", user.id)
          .maybeSingle();
        if (
          profile?.user_type === "talent" ||
          profile?.user_type === "company"
        ) {
          userType = profile.user_type;
        }

        if (
          profile?.created_at &&
          !window.sessionStorage.getItem(RETURNING_SESSION_FLAG_KEY)
        ) {
          const daysSinceSignup =
            (Date.now() - new Date(profile.created_at).getTime()) /
            (24 * 60 * 60 * 1000);
          if (daysSinceSignup >= RETURNING_SESSION_MIN_DAYS) {
            track(AnalyticsEvent.returningSession, {
              days_since_signup: Math.floor(daysSinceSignup),
            });
          }
          window.sessionStorage.setItem(RETURNING_SESSION_FLAG_KEY, "1");
        }

        if (alreadyIdentified !== user.id) {
          identifyUser(user.id, {
            email: user.email,
            user_type: userType || undefined,
          });
          window.localStorage.setItem(STORAGE_KEY, user.id);

          const { data: existing } = await supabase
            .from("users")
            .select("acquisition_channel")
            .eq("id", user.id)
            .maybeSingle();
          if (existing && !existing.acquisition_channel) {
            const attribution = await getFirstTouchAttribution();
            const { channel, raw } = mapAcquisitionChannel({
              utmSource: attribution?.utmSource,
              utmMedium: attribution?.utmMedium,
              referrer: attribution?.referrer,
              hasReferral: Boolean(readStashedReferralId()),
            });
            await supabase
              .from("users")
              .update({
                acquisition_channel: channel,
                acquisition_source_raw: raw,
              })
              .eq("id", user.id);
          }
        }

        // Link outbound click → signed-up persona (talent = candidate, company = HR/Founder side)
        await reportInterestAttribution({
          eventType: "signup",
          userType,
          userId: user.id,
        });

        // Talent invite attribution for OAuth / email-confirm paths.
        if (userType === "talent") {
          await reportTalentReferralAttribution();
        }
      } catch {
        // Analytics must never take down the product.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
