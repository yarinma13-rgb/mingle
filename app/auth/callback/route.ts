import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import type { UserType } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const pathParam = searchParams.get("path");
  const path: UserType = pathParam === "company" ? "company" : "talent";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.user.email) {
      // Only creates the row if it doesn't already exist, so a returning
      // user's existing type (and onboarding progress) is never touched —
      // the proxy already redirects them to their real onboarding path if
      // this query param picked the wrong one.
      await ensureUserProfile(supabase, data.user.id, data.user.email, path);
      return NextResponse.redirect(`${origin}/onboarding/${path}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?path=${path}`);
}
