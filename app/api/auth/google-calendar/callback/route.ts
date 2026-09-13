import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import { exchangeGoogleCalendarCode } from "@/lib/calendar/google";
import {
  GOOGLE_CALENDAR_OAUTH_COOKIE,
  parseGoogleCalendarOAuthState,
} from "@/lib/calendar/oauth-state";
import { upsertCalendarConnection } from "@/lib/calendar/persistence";
import { createClient } from "@/lib/supabase/server";

function redirectWith(returnTo: string, calendar: string) {
  const url = new URL(returnTo, appOrigin());
  url.searchParams.set("calendar", calendar);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const rawState = request.cookies.get(GOOGLE_CALENDAR_OAUTH_COOKIE.name)?.value;
  const parsed = parseGoogleCalendarOAuthState(rawState);
  const returnTo =
    request.cookies.get("mingle_gcal_return")?.value?.trim() || "/settings";
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/settings";

  const clear = (response: NextResponse) => {
    for (const name of [
      GOOGLE_CALENDAR_OAUTH_COOKIE.name,
      "mingle_gcal_return",
    ]) {
      response.cookies.set({
        name,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
      });
    }
    return response;
  };

  if (oauthError || !code || !state || !parsed || parsed.nonce !== state) {
    return clear(redirectWith(safeReturn, "error"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== parsed.companyId) {
    return clear(redirectWith(safeReturn, "error"));
  }

  try {
    const tokens = await exchangeGoogleCalendarCode(code);
    await upsertCalendarConnection(supabase, {
      companyId: user.id,
      connectedBy: user.id,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
      accountEmail: tokens.email,
    });
    return clear(redirectWith(safeReturn, "connected"));
  } catch {
    return clear(redirectWith(safeReturn, "error"));
  }
}
