export async function register() {
  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      const { initSentryServer } = await import("@/lib/monitoring/sentry");
      await initSentryServer();
    }
  } catch {
    // Observability must never block boot.
  }
}

export async function onRequestError(
  error: { digest?: string } | unknown,
): Promise<void> {
  try {
    const { captureException } = await import("@/lib/monitoring/sentry");
    captureException(error);
  } catch {
    // Swallow.
  }
}
