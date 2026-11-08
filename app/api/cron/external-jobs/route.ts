import { NextResponse } from "next/server";
import { runExternalJobsCrawl } from "@/lib/external-jobs/pipeline";
import { sendEngineAlert } from "@/lib/external-jobs/alerts";
import { engineStatus } from "@/lib/external-jobs/admin-data";
import { addSources, bulkSourcesSchema } from "@/lib/external-jobs/sources";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily External Opportunities run: crawl due sources, process new/changed
 * jobs, publish what passes every check, and re-verify published jobs.
 * Protect with CRON_SECRET (Authorization: Bearer … or ?secret=).
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(secret) && auth === secret;
}

/**
 * Operator action (same CRON_SECRET, header only): add sources in bulk.
 * Body: { termsReviewedBy, sources: [...] } — see lib/external-jobs/sources.ts.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get("action") !== "add-sources") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 503 });
  const parsed = bulkSourcesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  return NextResponse.json(await addSources(db, parsed.data));
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const urlSecret = new URL(request.url).searchParams.get("secret");
  if (!secret || (auth !== secret && urlSecret !== secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?status=1 (same secret): read-only snapshot of recent runs and job
  // counts, for operators checking on a run without the dashboard.
  if (new URL(request.url).searchParams.get("status") === "1") {
    return NextResponse.json(await engineStatus());
  }

  try {
    // Leave headroom under maxDuration to write the run summary.
    // ?force=1 (same secret) crawls every active source now, for testing and
    // catch-up; the scheduled call never sends it.
    const force = new URL(request.url).searchParams.get("force") === "1";
    const summary = await runExternalJobsCrawl({
      trigger: force ? "manual" : "cron",
      force,
      budgetMs: 240_000,
    });
    return NextResponse.json(summary, { status: summary.skipped ? 202 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await sendEngineAlert("Daily crawl crashed", [message]);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
