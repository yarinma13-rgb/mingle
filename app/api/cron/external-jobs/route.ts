import { NextResponse } from "next/server";
import { runExternalJobsCrawl } from "@/lib/external-jobs/pipeline";
import { sendEngineAlert } from "@/lib/external-jobs/alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily External Opportunities run: crawl due sources, process new/changed
 * jobs, publish what passes every check, and re-verify published jobs.
 * Protect with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  if (!secret || (auth !== secret && urlSecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Leave headroom under maxDuration to write the run summary.
    const summary = await runExternalJobsCrawl({ trigger: "cron", budgetMs: 240_000 });
    return NextResponse.json(summary, { status: summary.skipped ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendEngineAlert("Daily crawl crashed", [message]);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
