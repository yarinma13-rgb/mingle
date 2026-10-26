import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadPublishedExternalJob } from "@/lib/external-jobs/candidate";
import { recordEngagement } from "@/lib/external-jobs/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * Apply on an external job: count the click, then send the candidate straight
 * to the company's official application page. Nothing about the candidate is
 * appended to the URL or shared with the company (rule 8).
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const job = /^[0-9a-f-]{36}$/i.test(id) ? await loadPublishedExternalJob(supabase, id) : null;
  if (!job) {
    return NextResponse.redirect(new URL("/jobs?closed=1", req.url), 302);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await recordEngagement(job.id, "apply_click", user?.id ?? null);
  return NextResponse.redirect(job.apply_url, 302);
}
