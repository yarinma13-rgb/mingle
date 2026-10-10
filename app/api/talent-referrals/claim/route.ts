import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  claimTalentReferral,
  isMissingTalentReferralsTable,
} from "@/lib/talent-referrals/persistence";
import { AnalyticsEvent } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Attribute a stashed talent invite code to the just-signed-up user. Best-effort. */
export async function PUT(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const code = body.code?.trim().toLowerCase() ?? "";
  if (!/^[a-z0-9]{6,12}$/.test(code)) {
    return NextResponse.json({ error: "code required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    await claimTalentReferral(supabase, code);
    track(
      AnalyticsEvent.talentReferralSignupCompleted,
      { code },
      user.id,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      isMissingTalentReferralsTable(
        error as { message?: string; code?: string },
      )
    ) {
      return NextResponse.json({ ok: false });
    }
    // Never surface this to the signup UX — best-effort attribution.
    return NextResponse.json({ ok: false });
  }
}
