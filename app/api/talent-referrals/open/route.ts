import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isMissingTalentReferralsTable,
  recordTalentReferralOpen,
} from "@/lib/talent-referrals/persistence";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { code?: string; visitorKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim().toLowerCase() ?? "";
  const visitorKey = body.visitorKey?.trim() ?? "";
  if (!/^[a-z0-9]{6,12}$/.test(code) || visitorKey.length < 8) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createClient();
  try {
    const ok = await recordTalentReferralOpen(supabase, code, visitorKey);
    if (ok) {
      track(AnalyticsEvent.talentReferralOpened, { code });
    }
    return NextResponse.json({ ok });
  } catch (error) {
    if (
      isMissingTalentReferralsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }
    return NextResponse.json({ ok: false });
  }
}
