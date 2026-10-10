import { createHmac, timingSafeEqual } from "crypto";

export type InterestPayload = {
  /** company */
  c: string;
  /** contact name */
  n?: string;
  /** email */
  e?: string;
  /** open role */
  r?: string;
  /** destination path, default /welcome */
  d?: string;
  /** issued at unix seconds */
  iat: number;
};

function secret(): string | null {
  const value =
    process.env.OUTBOUND_LINK_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "";
  return value || null;
}

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

export function fingerprintToken(token: string): string {
  return createHmac("sha256", "mingle-interest-fp")
    .update(token)
    .digest("hex")
    .slice(0, 32);
}

export function signInterestPayload(payload: Omit<InterestPayload, "iat"> & { iat?: number }): string | null {
  const key = secret();
  if (!key) return null;
  const body: InterestPayload = {
    c: payload.c,
    n: payload.n || "",
    e: payload.e || "",
    r: payload.r || "",
    d: payload.d || "/welcome",
    iat: payload.iat ?? Math.floor(Date.now() / 1000),
  };
  const bodyB64 = b64url(JSON.stringify(body));
  const sig = b64url(createHmac("sha256", key).update(bodyB64).digest());
  return `${bodyB64}.${sig}`;
}

export function verifyInterestToken(token: string): InterestPayload | null {
  const key = secret();
  if (!key || !token || !token.includes(".")) return null;
  const [bodyB64, sig] = token.split(".");
  if (!bodyB64 || !sig) return null;
  const expected = b64url(createHmac("sha256", key).update(bodyB64).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(fromB64url(bodyB64).toString("utf8")) as InterestPayload;
    if (!parsed?.c || typeof parsed.iat !== "number") return null;
    // 180 days validity
    if (parsed.iat < Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 180) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function destinationForPayload(payload: InterestPayload, appUrl: string): string {
  const path = payload.d?.startsWith("/") ? payload.d : "/welcome";
  const url = new URL(path, appUrl.endsWith("/") ? appUrl : `${appUrl}/`);
  url.searchParams.set("utm_source", "outbound");
  url.searchParams.set("utm_medium", "interest_link");
  url.searchParams.set("utm_campaign", "mingle_match_report");
  if (payload.c) url.searchParams.set("utm_content", payload.c.slice(0, 64));
  if (payload.r) url.searchParams.set("role", payload.r.slice(0, 80));
  return url.toString();
}
