export function sentryDsn(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return value ? value : undefined;
}

/**
 * Local dev and Vercel preview deployments must not write into the production
 * PostHog project (they inflated pageviews with localhost traffic). Denylist
 * rather than allowlist so a missing env var can never silence production.
 */
export function isNonProductionRuntime(): boolean {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost") ||
      host.endsWith(".vercel.app")
    );
  }
  return (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  );
}

export function posthogKey(): string | undefined {
  if (isNonProductionRuntime()) return undefined;
  const value = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return value ? value : undefined;
}

/** Public Meta Pixel id (not a secret). Off on localhost and preview hosts. */
export function metaPixelId(): string | undefined {
  if (isNonProductionRuntime()) return undefined;
  const value = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  return value ? value : undefined;
}

export function posthogHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com"
  );
}
