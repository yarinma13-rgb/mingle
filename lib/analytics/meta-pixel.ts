import { metaPixelId } from "@/lib/monitoring/env";
import { getConsentState, resolveConsent, subscribeConsent } from "@/lib/analytics/consent";

type FbqStub = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: FbqStub;
};

declare global {
  interface Window {
    fbq?: FbqStub;
    _fbq?: FbqStub;
  }
}

export type MetaEventName = "CompleteRegistration" | "Lead";

let started = false;
let initPromise: Promise<void> | null = null;

function startPixel(id: string): void {
  if (started) {
    window.fbq?.("consent", "grant");
    return;
  }
  started = true;
  const stub = ((...args: unknown[]) => {
    if (stub.callMethod) stub.callMethod(...args);
    else stub.queue.push(args);
  }) as FbqStub;
  stub.push = stub;
  stub.loaded = true;
  stub.version = "2.0";
  stub.queue = [];
  window.fbq = stub;
  window._fbq = stub;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", id);
  window.fbq("track", "PageView");
}

/** Loads the Meta Pixel only after consent (or where consent isn't required). */
export function initMetaPixel(): Promise<void> {
  initPromise ??= (async () => {
    const id = metaPixelId();
    if (!id || typeof window === "undefined") return;
    try {
      subscribeConsent((state) => {
        if (state === "granted") startPixel(id);
        else if (started) window.fbq?.("consent", "revoke");
      });
      if ((await resolveConsent()) === "granted") startPixel(id);
    } catch {
      // Ad measurement must never take down the product.
    }
  })();
  return initPromise;
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * Reports a conversion to the browser Pixel and, through our own endpoint, to
 * the Conversions API. The shared eventId lets Meta deduplicate the two.
 */
export async function trackMetaEvent(
  event: MetaEventName,
  options: { eventId: string; email?: string },
): Promise<void> {
  try {
    if (!metaPixelId() || typeof window === "undefined") return;
    await initMetaPixel();
    if (getConsentState() !== "granted" || !started) return;

    window.fbq?.("track", event, {}, { eventID: options.eventId });
    void fetch("/api/meta/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        event,
        eventId: options.eventId,
        sourceUrl: window.location.href,
        email: options.email,
        fbp: readCookie("_fbp"),
        fbc: readCookie("_fbc"),
      }),
    }).catch(() => {});
  } catch {
    // Ignore.
  }
}
