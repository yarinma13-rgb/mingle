import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { destinationAfterAuth } from "@/lib/auth/destination";
import type { UserType } from "@/lib/supabase/types";

function resolveUserType(
  pathParam: string | null,
  metaType: unknown,
): UserType {
  // Signup metadata wins over URL — this is what keeps company accounts on
  // the company track after email confirmation (confirm links often omit path).
  if (metaType === "company" || metaType === "talent") return metaType;
  return pathParam === "company" ? "company" : "talent";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const pathParam = searchParams.get("path");
  const next =
    searchParams.get("next") === "/auth/update-password"
      ? "/auth/update-password"
      : null;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }
      const path = resolveUserType(
        pathParam,
        data.user.user_metadata?.user_type,
      );
      await ensureUserProfile(supabase, data.user.id, data.user.email, path);
      const dest = await destinationAfterAuth(
        supabase,
        data.user.id,
        path,
        data.user.email,
      );
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  const fallback = pathParam === "company" ? "company" : "talent";
  return NextResponse.redirect(`${origin}/auth?path=${fallback}`);
}
