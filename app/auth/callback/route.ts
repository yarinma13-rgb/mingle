import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { destinationAfterAuth } from "@/lib/auth/destination";
import type { UserType } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const pathParam = searchParams.get("path");
  const path: UserType = pathParam === "company" ? "company" : "talent";
  const next =
    searchParams.get("next") === "/auth/update-password"
      ? "/auth/update-password"
      : null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user && data.user.email) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      await ensureUserProfile(supabase, data.user.id, data.user.email, path);
      const dest = await destinationAfterAuth(supabase, data.user.id, path);
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?path=${path}`);
}
