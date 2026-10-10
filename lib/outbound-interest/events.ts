import { createClient } from "@supabase/supabase-js";
import type { InterestPayload } from "@/lib/outbound-interest/token";
import { fingerprintToken } from "@/lib/outbound-interest/token";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  // Untyped on purpose: table added in 0033 and may not be in generated Database yet.
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function logInterestEvent(input: {
  token: string;
  eventType: "click" | "visit" | "signup" | "followup_sent";
  payload: InterestPayload;
  destination?: string;
  userAgent?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const client = admin();
  if (!client) return { ok: true, skipped: true };

  const { error } = await client.from("outbound_interest_events").insert({
    token_fingerprint: fingerprintToken(input.token),
    event_type: input.eventType,
    company: input.payload.c || null,
    contact_name: input.payload.n || null,
    contact_email: input.payload.e || null,
    open_role: input.payload.r || null,
    destination: input.destination || input.payload.d || null,
    user_agent: input.userAgent?.slice(0, 300) || null,
    meta: input.meta || {},
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** True if a follow-up email was already sent for this token. */
export async function hasFollowUpBeenSent(token: string): Promise<boolean> {
  const client = admin();
  if (!client) return false;
  const fp = fingerprintToken(token);
  const { data, error } = await client
    .from("outbound_interest_events")
    .select("id")
    .eq("token_fingerprint", fp)
    .eq("event_type", "followup_sent")
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export async function listRecentInterestEvents(limit = 50): Promise<{
  ok: boolean;
  events?: Array<Record<string, unknown>>;
  error?: string;
  skipped?: boolean;
}> {
  const client = admin();
  if (!client) return { ok: true, skipped: true, events: [] };

  const { data, error } = await client
    .from("outbound_interest_events")
    .select(
      "id, token_fingerprint, event_type, company, contact_name, contact_email, open_role, destination, created_at, meta",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { ok: false, error: error.message };
  return { ok: true, events: data ?? [] };
}
