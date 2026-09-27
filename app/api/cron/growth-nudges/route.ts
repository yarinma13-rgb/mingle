import { NextResponse } from "next/server";
import { runGrowthNudges } from "@/lib/growth/run-nudges";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Daily growth nudges (stale onboarding / idle after onboarding).
 * Previously only ran as a side effect of the biweekly insights-report cron —
 * this gives nudges their own frequent schedule. Safe to run daily because
 * growth_nudge_log (migration 0040) dedupes across runs. Protected by CRON_SECRET.
 */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runGrowthNudges();
    return NextResponse.json({
      ok: true,
      enabled: result.enabled,
      actionsCount: result.actions.length,
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
