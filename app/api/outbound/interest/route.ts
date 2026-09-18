import { NextResponse } from "next/server";
import {
  listRecentInterestEvents,
  logInterestEvent,
} from "@/lib/outbound-interest/events";
import {
  signInterestPayload,
  verifyInterestToken,
} from "@/lib/outbound-interest/token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret =
    process.env.OUTBOUND_LINK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Mint a signed interest link for one outbound lead. */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    company?: string;
    contactName?: string;
    email?: string;
    openRole?: string;
    destination?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.company?.trim()) {
    return NextResponse.json({ error: "company required" }, { status: 400 });
  }

  const token = signInterestPayload({
    c: body.company.trim(),
    n: body.contactName?.trim(),
    e: body.email?.trim(),
    r: body.openRole?.trim(),
    d: body.destination?.trim() || "/welcome",
  });

  if (!token) {
    return NextResponse.json(
      { error: "OUTBOUND_LINK_SECRET or CRON_SECRET missing" },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  const interestUrl = `${appUrl.replace(/\/$/, "")}/r/${encodeURIComponent(token)}`;

  return NextResponse.json({
    ok: true,
    token,
    interestUrl,
    note: "Push notifications only after the person signs up and opts in.",
  });
}

/** List recent click/visit events (founder ops). */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await listRecentInterestEvents(100);
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}

/** Optional: record visit/signup after landing (client or auth callback can call). */
export async function PUT(req: Request) {
  let body: { token?: string; eventType?: "visit" | "signup" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const token = body.token?.trim() || "";
  const eventType = body.eventType === "signup" ? "signup" : "visit";
  const payload = verifyInterestToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }
  const result = await logInterestEvent({
    token,
    eventType,
    payload,
    userAgent: req.headers.get("user-agent"),
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result);
}
