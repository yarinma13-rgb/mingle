"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { identifyUser } from "@/lib/analytics/track";

const STORAGE_KEY = "mingle_ph_identified_user_id";

/**
 * Safety net for auth paths that never run client JS between success and
 * landing on a page — Google OAuth and email-confirmation links both finish
 * with a server-side redirect (app/auth/callback, app/auth/confirm), so
 * there's no moment in those flows to call posthog.identify() directly.
 * Mounted once in the root layout, this catches every authenticated session
 * on first client render and links it to PostHog's first-touch UTM data
 * (merged in by identifyUser), regardless of which auth path was used.
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
        if (cancelled || !user || alreadyIdentified === user.id) return;

        identifyUser(user.id, { email: user.email });
        window.localStorage.setItem(STORAGE_KEY, user.id);
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
