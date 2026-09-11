import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
import { destinationAfterAuth } from "@/lib/auth/destination";
import type { UserType } from "@/lib/supabase/types";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function resolvePath(
  pathParam: string | null,
  userType: unknown,
): UserType {
  // Prefer signup metadata so company accounts stay company even when the
  // email confirm URL has no path query (the documented Supabase template).
  if (userType === "company" || userType === "talent") return userType;
  if (pathParam === "company") return "company";
  return "talent";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type =
    rawType && OTP_TYPES.has(rawType as EmailOtpType)
      ? (rawType as EmailOtpType)
      : null;
  const pathParam = searchParams.get("path");

  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user?.email) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
      const path = resolvePath(pathParam, data.user.user_metadata?.user_type);
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

  const path = resolvePath(pathParam, null);
  return NextResponse.redirect(`${origin}/auth?path=${path}`);
}
