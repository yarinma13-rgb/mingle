/**
 * Private founder pitch deck at /deck.
 * Same visibility rules as /demo: open in local/preview, blocked in
 * production unless MINGLE_ENABLE_DEMO=1.
 */
export function isDeckRouteEnabled(): boolean {
  if (process.env.MINGLE_ENABLE_DEMO === "1") return true;
  if (process.env.MINGLE_ENABLE_DEMO === "0") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV == null) {
    return false;
  }
  return true;
}
