import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyToRole } from "@/lib/careers/persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Record a stashed career-page application for the just-signed-up user. Best-effort. */
export async function PUT(req: Request) {
  let body: { roleId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const roleId = body.roleId?.trim();
  if (!roleId) {
    return NextResponse.json({ error: "roleId required" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  try {
    await applyToRole(supabase, roleId, user.id);
    return NextResponse.json({ ok: true });
  } catch {
    // Never surface this to the signup UX — best-effort attribution.
    return NextResponse.json({ ok: false });
  }
}
