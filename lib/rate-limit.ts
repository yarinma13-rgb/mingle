import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/** Rolling windows sized for a small closed pilot, not a public launch. */
export const CONNECTION_SENDS_PER_HOUR = 20;
export const MESSAGES_PER_HOUR = 60;
export const MESSAGES_PER_MINUTE = 10;

export const RATE_LIMIT_COPY = {
  connection:
    "You've reached the connection pace for now. Come back in a little while for people you really want to know.",
  message:
    "That's a lot of messages in a short span. Pause for a moment, then pick the conversation back up.",
} as const;

export class RateLimitError extends Error {
  readonly kind: "connection" | "message";

  constructor(kind: "connection" | "message") {
    super(RATE_LIMIT_COPY[kind]);
    this.name = "RateLimitError";
    this.kind = kind;
  }
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    error instanceof RateLimitError ||
    (error instanceof Error && error.name === "RateLimitError")
  );
}

function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function atLimit(
  count: number | null,
  error: { message?: string } | null,
  limit: number,
): boolean {
  if (error) return false;
  return (count ?? 0) >= limit;
}

export async function assertConnectionSendAllowed(
  supabase: SupabaseClient<Database>,
  fromUserId: string,
): Promise<void> {
  const since = isoAgo(60 * 60 * 1000);
  try {
    const [created, resent] = await Promise.all([
      supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", fromUserId)
        .gte("created_at", since),
      supabase
        .from("connections")
        .select("id", { count: "exact", head: true })
        .eq("requester_id", fromUserId)
        .eq("status", "pending")
        .gte("updated_at", since)
        .lt("created_at", since),
    ]);
    const used = (created.count ?? 0) + (resent.count ?? 0);
    if (created.error || resent.error) return;
    if (used >= CONNECTION_SENDS_PER_HOUR) {
      throw new RateLimitError("connection");
    }
  } catch (error) {
    if (isRateLimitError(error)) throw error;
  }
}

export async function assertMessageSendAllowed(
  supabase: SupabaseClient<Database>,
  senderId: string,
): Promise<void> {
  try {
    const hourSince = isoAgo(60 * 60 * 1000);
    const minuteSince = isoAgo(60 * 1000);
    const [hour, minute] = await Promise.all([
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", senderId)
        .gte("created_at", hourSince),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", senderId)
        .gte("created_at", minuteSince),
    ]);
    if (atLimit(hour.count, hour.error, MESSAGES_PER_HOUR)) {
      throw new RateLimitError("message");
    }
    if (atLimit(minute.count, minute.error, MESSAGES_PER_MINUTE)) {
      throw new RateLimitError("message");
    }
  } catch (error) {
    if (isRateLimitError(error)) throw error;
  }
}
