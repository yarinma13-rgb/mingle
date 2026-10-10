"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

/**
 * Fires notification_opened when a link from an email/push notification
 * lands on any page with ?ntf=<notification_type>. Mounted once in the
 * root layout so it works regardless of which page the link points to.
 */
export function NotificationOpenBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const notificationType = params.get("ntf");
    if (!notificationType) return;
    track(AnalyticsEvent.notificationOpened, {
      notification_type: notificationType,
    });
  }, [params]);

  return null;
}
