import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import {
  googleCalendarAuthorizeUrl,
  googleCalendarConfigured,
} from "@/lib/calendar/google";
import {
  GOOGLE_CALENDAR_OAUTH_COOKIE,
  serializeGoogleCalendarOAuthState,
} from "@/lib/calendar/oauth-state";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const returnTo =
    request.nextUrl.searchParams.get("returnTo")?.trim() || "/settings";
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/settings";

  if (!googleCalendarConfigured()) {
    const url = new URL(safeReturn, appOrigin());
    url.searchParams.set("calendar", "not_configured");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/auth", appOrigin()));
  }

  const { data: account } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (account?.user_type !== "company") {
    const url = new URL(safeReturn, appOrigin());
    url.searchParams.set("calendar", "company_only");
    return NextResponse.redirect(url);
  }

  const nonce = randomBytes(16).toString("hex");
  const response = NextResponse.redirect(googleCalendarAuthorizeUrl(nonce));
  response.cookies.set({
    name: GOOGLE_CALENDAR_OAUTH_COOKIE.name,
    value: serializeGoogleCalendarOAuthState({
      nonce,
      companyId: user.id,
    }),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_CALENDAR_OAUTH_COOKIE.maxAge,
  });
  response.cookies.set({
    name: "mingle_gcal_return",
    value: safeReturn,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_CALENDAR_OAUTH_COOKIE.maxAge,
  });
  return response;
}
