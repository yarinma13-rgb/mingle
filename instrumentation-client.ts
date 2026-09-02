try {
  void import("@/lib/monitoring/sentry").then((mod) => mod.initSentryBrowser());
  void import("@/lib/analytics/track").then((mod) => mod.initPosthogBrowser());
} catch {
  // Client instrumentation must never block the app.
}
