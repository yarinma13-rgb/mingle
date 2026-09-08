import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import { exchangeLinkedInCode } from "@/lib/linkedin/oauth";
import {
  LINKEDIN_OAUTH_COOKIE,
  LINKEDIN_REC_COOKIE,
  parseLinkedInOAuthState,
  serializeLinkedInRecSession,
} from "@/lib/recommendations/linkedin-session";

function fail(token: string | null) {
  const path = token ? `/recommend/${token}` : "/";
  const url = new URL(path, appOrigin());
  if (token) url.searchParams.set("error", "linkedin");
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oauthError = request.nextUrl.searchParams.get("error");
  const rawState = request.cookies.get(LINKEDIN_OAUTH_COOKIE.name)?.value;
  const parsed = parseLinkedInOAuthState(rawState);

  const clearOauth = (response: NextResponse) => {
    response.cookies.set({
      name: LINKEDIN_OAUTH_COOKIE.name,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  };

  if (oauthError || !code || !state || !parsed || parsed.nonce !== state) {
    return clearOauth(fail(parsed?.token ?? null));
  }

  try {
    const identity = await exchangeLinkedInCode(code);
    const dest = new URL(`/recommend/${parsed.token}`, appOrigin());
    const response = NextResponse.redirect(dest);
    clearOauth(response);
    response.cookies.set({
      name: LINKEDIN_REC_COOKIE.name,
      value: serializeLinkedInRecSession({
        token: parsed.token,
        sub: identity.sub,
        name: identity.name,
      }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LINKEDIN_REC_COOKIE.maxAge,
    });
    return response;
  } catch {
    return clearOauth(fail(parsed.token));
  }
}
