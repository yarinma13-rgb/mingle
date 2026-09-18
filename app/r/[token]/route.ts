import { NextResponse } from "next/server";
import {
  destinationForPayload,
  verifyInterestToken,
} from "@/lib/outbound-interest/token";
import { logInterestEvent } from "@/lib/outbound-interest/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * Unique outbound interest link.
 * GET /r/[token] → log click → redirect to /welcome with UTMs.
 */
export async function GET(req: Request, { params }: Params) {
  const { token: raw } = await params;
  const token = decodeURIComponent(raw || "");
  const payload = verifyInterestToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL("/welcome", req.url), 302);
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(req.url).origin;
  const destination = new URL(destinationForPayload(payload, appUrl));
  destination.searchParams.set("interest_token", token);

  // Fire-and-forget logging should not block redirect hard; still await briefly.
  try {
    await logInterestEvent({
      token,
      eventType: "click",
      payload,
      destination: destination.toString(),
      userAgent: req.headers.get("user-agent"),
      meta: { path: "/r/[token]" },
    });
  } catch {
    // Attribution must never break the redirect.
  }

  return NextResponse.redirect(destination.toString(), 302);
}
