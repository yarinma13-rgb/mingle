import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendGrowthNudgeEmail } from "@/lib/email/growth-nudge";
import { GROWTH_NUDGE_MIN_HOURS } from "@/lib/analytics/metrics";
import type { Database } from "@/lib/supabase/types";

export type GrowthNudgeRunResult = {
  enabled: boolean;
  actions: string[];
  errors: string[];
};

/** How long before the same nudge_type can be sent again to the same user. */
const NUDGE_COOLDOWN_DAYS = 7;

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

async function recentlyNudged(
  admin: SupabaseClient<Database>,
  userId: string,
  nudgeType: string,
): Promise<boolean> {
  const { count } = await admin
    .from("growth_nudge_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("nudge_type", nudgeType)
    .gte("sent_at", hoursAgo(NUDGE_COOLDOWN_DAYS * 24));
  return (count ?? 0) > 0;
}

async function logNudge(
  admin: SupabaseClient<Database>,
  userId: string,
  nudgeType: string,
) {
  await admin
    .from("growth_nudge_log")
    .insert({ user_id: userId, nudge_type: nudgeType });
}

/**
 * Growth nudge runner — can be invoked on its own schedule (e.g. daily cron)
 * as well as from the biweekly report. Requires SUPABASE_SERVICE_ROLE_KEY +
 * RESEND_API_KEY. Dedupe is cross-run via growth_nudge_log (see migration
 * 0040), so running this more often than every 14 days is now safe.
 */
export async function runGrowthNudges(): Promise<GrowthNudgeRunResult> {
  const enabled = process.env.GROWTH_NUDGES_ENABLED?.trim() === "1";
  const admin = createAdminClient();
  if (!enabled || !admin) {
    return {
      enabled: false,
      actions: [],
      errors: enabled && !admin ? ["SUPABASE_SERVICE_ROLE_KEY missing"] : [],
    };
  }

  const actions: string[] = [];
  const errors: string[] = [];
  const nudged = new Set<string>();

  const { data: staleOnboarding, error: obErr } = await admin
    .from("users")
    .select("id, email, onboarding_status, created_at")
    .neq("onboarding_status", "completed")
    .lt("created_at", hoursAgo(24))
    .gte("created_at", hoursAgo(24 * 14))
    .limit(50);
  if (obErr) errors.push(obErr.message);

  for (const row of staleOnboarding ?? []) {
    if (!row.email || nudged.has(row.id)) continue;
    if (await recentlyNudged(admin, row.id, "finish_profile")) continue;
    const sent = await sendGrowthNudgeEmail({
      to: row.email,
      subject: "Finish your mingle profile",
      body: `Hi — you started mingle but your profile is not complete yet.\n\nPick up where you left off so Discover can show you real matches.\n\n${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers"}/profile/build?ntf=finish_profile`,
    });
    if (sent.ok) {
      nudged.add(row.id);
      await logNudge(admin, row.id, "finish_profile");
      actions.push(`finish_profile_24h → ${row.id}`);
    } else if (sent.error) errors.push(sent.error);
  }

  const { data: idleDiscover, error: discErr } = await admin
    .from("users")
    .select("id, email, created_at")
    .eq("onboarding_status", "completed")
    .lt("created_at", hoursAgo(GROWTH_NUDGE_MIN_HOURS))
    .limit(50);
  if (discErr) errors.push(discErr.message);

  for (const row of idleDiscover ?? []) {
    if (!row.email || nudged.has(row.id)) continue;
    if (await recentlyNudged(admin, row.id, "open_discover")) continue;
    const { count } = await admin
      .from("connections")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${row.id},recipient_id.eq.${row.id}`);
    if ((count ?? 0) > 0) continue;

    const sent = await sendGrowthNudgeEmail({
      to: row.email,
      subject: "Your matches are waiting on mingle",
      body: `Your profile is ready — open Discover and mark who is worth a real conversation.\n\n${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers"}/discover?ntf=open_discover`,
    });
    if (sent.ok) {
      nudged.add(row.id);
      await logNudge(admin, row.id, "open_discover");
      actions.push(`open_discover_24h → ${row.id}`);
    } else if (sent.error) errors.push(sent.error);
  }

  return { enabled: true, actions, errors };
}
