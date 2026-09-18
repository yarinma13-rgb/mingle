import { NextResponse } from "next/server";
import {
  destinationForPayload,
  verifyInterestToken,
} from "@/lib/outbound-interest/token";
import {
  hasFollowUpBeenSent,
  logInterestEvent,
} from "@/lib/outbound-interest/events";
import { sendInterestFollowUpEmail } from "@/lib/email/interest-followup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/**
 * Unique outbound interest link.
 * GET /r/[token] → log click → optional one-time follow-up email → redirect.
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

  try {
    await logInterestEvent({
      token,
      eventType: "click",
      payload,
      destination: destination.toString(),
      userAgent: req.headers.get("user-agent"),
      meta: { path: "/r/[token]" },
    });

    const email = (payload.e || "").trim();
    if (email) {
      const already = await hasFollowUpBeenSent(token);
      if (!already) {
        const sent = await sendInterestFollowUpEmail({ to: email, payload });
        if (sent.ok && !sent.skipped) {
          await logInterestEvent({
            token,
            eventType: "followup_sent",
            payload,
            destination: destination.toString(),
            userAgent: req.headers.get("user-agent"),
            meta: { channel: "resend" },
          });
        }
      }
    }
  } catch {
    // Attribution / email must never break the redirect.
  }

  return NextResponse.redirect(destination.toString(), 302);
}
