"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { identifyUser } from "@/lib/analytics/track";
import { reportInterestAttribution } from "@/lib/outbound-interest/client";
import type { UserType } from "@/lib/supabase/types";

const STORAGE_KEY = "mingle_ph_identified_user_id";

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
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();
        if (
          profile?.user_type === "talent" ||
          profile?.user_type === "company"
        ) {
          userType = profile.user_type;
        }

        if (alreadyIdentified !== user.id) {
          identifyUser(user.id, {
            email: user.email,
            user_type: userType || undefined,
          });
          window.localStorage.setItem(STORAGE_KEY, user.id);
        }

        // Link outbound click → signed-up persona (talent = candidate, company = HR/Founder side)
        await reportInterestAttribution({
          eventType: "signup",
          userType,
          userId: user.id,
        });
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
