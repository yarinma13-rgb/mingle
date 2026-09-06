import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/ensure-profile";
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
  if (pathParam === "company" || userType === "company") return "company";
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
      const path = resolvePath(pathParam, data.user.user_metadata?.user_type);
      await ensureUserProfile(supabase, data.user.id, data.user.email, path);
      return NextResponse.redirect(`${origin}/onboarding/${path}`);
    }
  }

  const path = resolvePath(pathParam, null);
  return NextResponse.redirect(`${origin}/auth?path=${path}`);
}
