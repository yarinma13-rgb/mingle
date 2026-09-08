import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "mingle_li_rec";
const MAX_AGE = 60 * 30;

type LinkedInRecSession = {
  token: string;
  sub: string;
  name: string;
};

function secret(): string {
  const value = process.env.LINKEDIN_CLIENT_SECRET?.trim();
  if (!value) throw new Error("linkedin env missing");
  return value;
}

type LinkedInOAuthState = {
  nonce: string;
  token: string;
};

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function serializeSigned(value: unknown): string {
  const payload = Buffer.from(JSON.stringify(value), "utf8").toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

function parseSigned<T>(raw: string | undefined, check: (value: T) => boolean): T | null {
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = sign(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as T;
    if (!check(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function serializeLinkedInRecSession(session: LinkedInRecSession): string {
  return serializeSigned(session);
}

export function parseLinkedInRecSession(raw: string | undefined): LinkedInRecSession | null {
  return parseSigned<LinkedInRecSession>(
    raw,
    (parsed) => Boolean(parsed.token && parsed.sub && parsed.name),
  );
}

export function serializeLinkedInOAuthState(state: LinkedInOAuthState): string {
  return serializeSigned(state);
}

export function parseLinkedInOAuthState(raw: string | undefined): LinkedInOAuthState | null {
  return parseSigned<LinkedInOAuthState>(
    raw,
    (parsed) => Boolean(parsed.nonce && parsed.token),
  );
}

export const LINKEDIN_REC_COOKIE = {
  name: COOKIE,
  maxAge: MAX_AGE,
} as const;

export const LINKEDIN_OAUTH_COOKIE = {
  name: "mingle_li_oauth",
  maxAge: 60 * 10,
} as const;
