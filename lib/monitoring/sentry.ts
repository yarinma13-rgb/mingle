import { sentryDsn } from "@/lib/monitoring/env";

export function captureException(error: unknown): void {
  try {
    if (!sentryDsn()) return;
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  } catch {
    // Monitoring must never take down the product.
  }
}

export async function initSentryServer(): Promise<void> {
  const dsn = sentryDsn();
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      enabled: true,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  } catch {
    // Missing DSN or SDK failure is a no-op.
  }
}

export async function initSentryBrowser(): Promise<void> {
  const dsn = sentryDsn();
  if (!dsn) return;
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      enabled: true,
      tracesSampleRate: 0.1,
      sendDefaultPii: false,
    });
  } catch {
    // Missing DSN or SDK failure is a no-op.
  }
}
