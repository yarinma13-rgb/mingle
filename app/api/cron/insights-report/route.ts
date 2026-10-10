import { NextResponse } from "next/server";
import {
  buildGrowthReport,
  sendGrowthReportEmail,
} from "@/lib/analytics/growth-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = req.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/** Biweekly founder growth + learning report. Protected by CRON_SECRET. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await buildGrowthReport(14);
    const result = await sendGrowthReportEmail(report);
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          recipients: result.recipients,
          markdownPreview: report.markdown.slice(0, 500),
        },
        { status: result.error?.includes("missing") ? 503 : 500 },
      );
    }
    return NextResponse.json({
      ok: true,
      recipients: result.recipients,
      generatedAt: report.generatedAt,
      northStar: report.snapshot.current.minglesCreated,
      snapshotSource: report.snapshot.source,
      nudges: report.nudges.actions.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
