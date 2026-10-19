import { NextResponse } from "next/server";
import { countryRequiresConsent } from "@/lib/analytics/consent-regions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tells the browser whether this visitor must opt in to analytics cookies.
 * Kept as a tiny API route (not a header read in the root layout) so pages
 * stay statically rendered. Returns no location, only the yes/no answer.
 */
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  return NextResponse.json(
    { requiresConsent: countryRequiresConsent(country) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
