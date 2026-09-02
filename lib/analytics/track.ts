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

export async function initPosthogBrowser(): Promise<void> {
  const key = posthogKey();
  if (!key || typeof window === "undefined") return;
  try {
    const posthog = (await import("posthog-js")).default;
    posthog.init(key, {
      api_host: posthogHost(),
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  } catch {
    // Missing key or blocked network is a no-op.
  }
}

export function identifyUser(userId: string, traits?: EventProps): void {
  if (!posthogKey() || typeof window === "undefined") return;
  void import("posthog-js")
    .then((mod) => {
      mod.default.identify(userId, cleanProps(traits));
    })
    .catch(() => {});
}
