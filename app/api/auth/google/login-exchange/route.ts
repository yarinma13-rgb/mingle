import { NextResponse } from "next/server";

/**
 * Exchanges a Google Identity Services authorization code (from
 * google.accounts.oauth2.initCodeClient, ux_mode: "popup") for an ID token,
 * server-side only — this is where GOOGLE_CLIENT_SECRET is used, it never
 * reaches the browser. The client then hands the ID token to
 * supabase.auth.signInWithIdToken() to establish the session.
 *
 * This exists so "Continue with Google" never redirects through Supabase's
 * own auth host (that's what made Google's consent screen show
 * *.supabase.co instead of mingle.careers) — see docs/AUTH_GOOGLE_BRANDING.md.
 * "postmessage" below is Google's own reserved redirect_uri value for this
 * popup code-exchange flow — it is not a real URL and needs no entry in
 * Google Cloud Console's Authorized redirect URIs.
 */

type TokenResponse = {
  id_token?: string;
  error?: string;
  error_description?: string;
};

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google sign-in isn't configured on the server." },
      { status: 500 },
    );
  }

  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof code !== "string" || !code) {
    return NextResponse.json({ error: "Missing code." }, { status: 400 });
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: "postmessage",
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json()) as TokenResponse;

  if (!tokenRes.ok || !tokenJson.id_token) {
    return NextResponse.json(
      { error: tokenJson.error_description || "Google sign-in failed." },
      { status: 400 },
    );
  }

  return NextResponse.json({ idToken: tokenJson.id_token });
}
