import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { claimReferral } from "@/lib/referrals/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Attribute a stashed referral id to the just-signed-up user. Best-effort. */
export async function PUT(req: Request) {
  let body: { referralId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const referralId = body.referralId?.trim();
  if (!referralId) {
    return NextResponse.json({ error: "referralId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    await claimReferral(supabase, referralId);
    return NextResponse.json({ ok: true });
  } catch {
    // Never surface this to the signup UX — best-effort attribution.
    return NextResponse.json({ ok: false });
  }
}
