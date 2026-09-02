export function sentryDsn(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return value ? value : undefined;
}

export function posthogKey(): string | undefined {
  const value = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return value ? value : undefined;
}

export function posthogHost(): string {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com"
  );
}
