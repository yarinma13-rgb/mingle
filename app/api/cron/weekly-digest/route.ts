import { NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/growth/run-weekly-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Weekly "Your mingle this week" digest to every activated user. Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    return NextResponse.json({
      ok: true,
      enabled: result.enabled,
      sent: result.sent,
      errors: result.errors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
