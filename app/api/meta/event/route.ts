import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_EVENTS = new Set(["CompleteRegistration", "Lead"]);
const GRAPH_VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const short = (value: unknown, max: number): string | undefined =>
  typeof value === "string" && value.length > 0 && value.length <= max ? value : undefined;

/**
 * Forwards a conversion to Meta's Conversions API. The access token only ever
 * lives in META_CAPI_ACCESS_TOKEN on the server. Without the env vars this is
 * a silent no-op, so deploying before configuring Vercel is safe.
 */
export async function POST(request: Request) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const noContent = new Response(null, { status: 204 });
  if (!pixelId || !token) return noContent;
  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development") {
    return noContent;
  }

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  try {
    if (!origin || !host || new URL(origin).host !== host) {
      return new Response(null, { status: 403 });
    }
  } catch {
    return new Response(null, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const event = short(body.event, 40);
  const eventId = short(body.eventId, 100);
  const sourceUrl = short(body.sourceUrl, 500);
  if (!event || !ALLOWED_EVENTS.has(event) || !eventId || !sourceUrl) {
    return new Response(null, { status: 400 });
  }

  const email = short(body.email, 200)?.trim().toLowerCase();
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userData: Record<string, string> = {};
  if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) userData.em = sha256(email);
  if (forwardedFor) userData.client_ip_address = forwardedFor;
  const userAgent = request.headers.get("user-agent");
  if (userAgent) userData.client_user_agent = userAgent.slice(0, 500);
  const fbp = short(body.fbp, 200);
  const fbc = short(body.fbc, 200);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: userData,
      },
    ],
  };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) console.error("[meta-capi] rejected:", res.status);
  } catch (error) {
    console.error("[meta-capi] failed:", error instanceof Error ? error.message : error);
  }
  return noContent;
}
