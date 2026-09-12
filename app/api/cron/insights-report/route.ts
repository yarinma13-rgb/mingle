import { NextResponse } from "next/server";
import {
  buildInsightsReport,
  sendInsightsReportEmail,
} from "@/lib/analytics/insights-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Biweekly founder UX insights email. Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await buildInsightsReport(14);
    const result = await sendInsightsReportEmail(report);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error, recipients: result.recipients, report },
        { status: 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      recipients: result.recipients,
      source: report.source,
      generatedAt: report.generatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
