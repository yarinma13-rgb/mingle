import { appOrigin } from "@/lib/app-origin";

export function linkedinRedirectUri(): string {
  return `${appOrigin()}/api/auth/linkedin/callback`;
}

export function linkedinAuthorizeUrl(state: string): string {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  if (!clientId) throw new Error("linkedin env missing");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: linkedinRedirectUri(),
    state,
    scope: "openid profile email",
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

type LinkedInTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type LinkedInUserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
};

export async function exchangeLinkedInCode(code: string): Promise<{
  sub: string;
  name: string;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID?.trim();
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("linkedin env missing");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: linkedinRedirectUri(),
  });

  const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tokenJson = (await tokenRes.json()) as LinkedInTokenResponse;
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || "linkedin token failed");
  }

  const userRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const user = (await userRes.json()) as LinkedInUserInfo;
  if (!userRes.ok || !user.sub) {
    throw new Error("linkedin userinfo failed");
  }

  const name =
    user.name?.trim() ||
    [user.given_name, user.family_name].filter(Boolean).join(" ").trim() ||
    "LinkedIn member";

  return { sub: user.sub, name };
}
