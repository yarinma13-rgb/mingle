import { posthogHost, posthogKey } from "@/lib/monitoring/env";
import type { AnalyticsEventName } from "@/lib/analytics/events";

type EventProps = Record<string, string | number | boolean | null | undefined>;

function cleanProps(
  properties?: EventProps,
): Record<string, string | number | boolean> {
  if (!properties) return {};
  const next: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) continue;
    next[key] = value;
  }
  return next;
}

/** Fire-and-forget product event. Never throws into UI. */
export function track(
  event: AnalyticsEventName,
  properties?: EventProps,
  distinctId?: string,
): void {
  void capture(event, properties, distinctId);
}

async function capture(
  event: AnalyticsEventName,
  properties?: EventProps,
  distinctId?: string,
): Promise<void> {
  const key = posthogKey();
  if (!key) return;
  const props = cleanProps(properties);

  try {
    if (typeof window !== "undefined") {
      const posthog = (await import("posthog-js")).default;
      posthog.capture(event, props);
      return;
    }

    const { PostHog } = await import("posthog-node");
    const client = new PostHog(key, { host: posthogHost() });
    client.capture({
      distinctId: distinctId ?? "server",
      event,
      properties: props,
    });
    await client.shutdown();
  } catch {
    // Analytics must never take down the product.
  }
}

/**
 * Browser bootstrap. Enables pageviews, autocapture, heatmaps,
 * and masked session recording when the PostHog project allows it.
 */
let browserInitialized = false;

export async function initPosthogBrowser(): Promise<void> {
  const key = posthogKey();
  if (!key || typeof window === "undefined" || browserInitialized) return;
  try {
    const posthog = (await import("posthog-js")).default;
    browserInitialized = true;
    posthog.init(key, {
      api_host: posthogHost(),
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      capture_heatmaps: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-mask]",
      },
      persistence: "localStorage+cookie",
    });
  } catch {
    // Missing key or blocked network is a no-op.
  }
}

/**
 * Identifies the user and stamps their first-touch UTM data (captured by
 * PostHog on their very first anonymous pageview) onto the person profile.
 * Without this, signups can never be attributed back to a campaign/source
 * because the anonymous session's UTM properties are otherwise never linked
 * to the authenticated distinct_id.
 */
export function identifyUser(userId: string, traits?: EventProps): void {
  if (!posthogKey() || typeof window === "undefined") return;
  void import("posthog-js")
    .then((mod) => {
      const posthog = mod.default;
      const attribution: EventProps = {
        utm_source: posthog.get_property("$initial_utm_source"),
        utm_medium: posthog.get_property("$initial_utm_medium"),
        utm_campaign: posthog.get_property("$initial_utm_campaign"),
        utm_content: posthog.get_property("$initial_utm_content"),
        initial_referrer: posthog.get_property("$initial_referrer"),
      };
      posthog.identify(userId, cleanProps({ ...attribution, ...traits }));
    })
    .catch(() => {});
}

export function resetAnalytics(): void {
  if (!posthogKey() || typeof window === "undefined") return;
  void import("posthog-js")
    .then((mod) => {
      mod.default.reset();
    })
    .catch(() => {});
}
