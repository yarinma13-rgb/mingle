/**
 * Personal investor walkthrough at /demo — not a public product surface.
 * Enabled in local/dev/preview by default; blocked in production unless
 * MINGLE_ENABLE_DEMO=1 is set explicitly.
 */
export function isDemoRouteEnabled(): boolean {
  if (process.env.MINGLE_ENABLE_DEMO === "1") return true;
  if (process.env.MINGLE_ENABLE_DEMO === "0") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV == null) {
    return false;
  }
  return true;
}
