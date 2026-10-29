import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Old-style verification link. A GET must never remove anything (mail
 * scanners prefetch links), so it only forwards to the confirmation page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/job-removal/confirm", req.url);
  target.searchParams.set("id", url.searchParams.get("id") ?? "");
  target.searchParams.set("token", url.searchParams.get("token") ?? "");
  return NextResponse.redirect(target, 302);
}
