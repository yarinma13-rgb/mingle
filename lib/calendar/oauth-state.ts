import { createHmac, timingSafeEqual } from "crypto";

export const GOOGLE_CALENDAR_OAUTH_COOKIE = {
  name: "mingle_gcal_oauth",
  maxAge: 60 * 10,
};

function signingSecret(): string {
  return (
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "mingle-dev-google-calendar"
  );
}

export function serializeGoogleCalendarOAuthState(payload: {
  nonce: string;
  companyId: string;
}): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", signingSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function parseGoogleCalendarOAuthState(
  raw: string | undefined,
): { nonce: string; companyId: string } | null {
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", signingSecret())
    .update(body)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as { nonce?: string; companyId?: string };
    if (!parsed.nonce || !parsed.companyId) return null;
    return { nonce: parsed.nonce, companyId: parsed.companyId };
  } catch {
    return null;
  }
}
