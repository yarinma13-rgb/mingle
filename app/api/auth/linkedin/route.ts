import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { appOrigin } from "@/lib/app-origin";
import { linkedinAuthorizeUrl } from "@/lib/linkedin/oauth";
import { previewRecommendationRequest } from "@/lib/recommendations/persistence";
import {
  LINKEDIN_OAUTH_COOKIE,
  serializeLinkedInOAuthState,
} from "@/lib/recommendations/linkedin-session";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function recommendRedirect(token: string, error?: string) {
  const url = new URL(`/recommend/${token}`, appOrigin());
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
  if (!UUID.test(token)) {
    return NextResponse.redirect(new URL("/", appOrigin()));
  }

  try {
    const supabase = await createClient();
    const preview = await previewRecommendationRequest(supabase, token);
    if (!preview || preview.status !== "pending") {
      return NextResponse.redirect(recommendRedirect(token, "closed"));
    }

    const nonce = randomBytes(16).toString("hex");
    const response = NextResponse.redirect(linkedinAuthorizeUrl(nonce));
    response.cookies.set({
      name: LINKEDIN_OAUTH_COOKIE.name,
      value: serializeLinkedInOAuthState({ nonce, token }),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LINKEDIN_OAUTH_COOKIE.maxAge,
    });
    return response;
  } catch {
    return NextResponse.redirect(recommendRedirect(token, "linkedin"));
  }
}
