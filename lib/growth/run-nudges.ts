import { createAdminClient } from "@/lib/supabase/admin";
import { sendGrowthNudgeEmail } from "@/lib/email/growth-nudge";
import { GROWTH_NUDGE_MIN_HOURS } from "@/lib/analytics/metrics";

export type GrowthNudgeRunResult = {
  enabled: boolean;
  actions: string[];
  errors: string[];
};

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

/**
 * Pilot nudge runner — invoked from the biweekly cron.
 * Requires SUPABASE_SERVICE_ROLE_KEY + RESEND_API_KEY.
 * Rate limit: one nudge email per user per run (not a full dedupe store yet).
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
    const sent = await sendGrowthNudgeEmail({
      to: row.email,
      subject: "Finish your mingle profile",
      body: `Hi — you started mingle but your profile is not complete yet.\n\nPick up where you left off so Discover can show you real matches.\n\n${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers"}/profile/build`,
    });
    if (sent.ok) {
      nudged.add(row.id);
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
    const { count } = await admin
      .from("connections")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${row.id},recipient_id.eq.${row.id}`);
    if ((count ?? 0) > 0) continue;

    const sent = await sendGrowthNudgeEmail({
      to: row.email,
      subject: "Your matches are waiting on mingle",
      body: `Your profile is ready — open Discover and mark who is worth a real conversation.\n\n${process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers"}/discover`,
    });
    if (sent.ok) {
      nudged.add(row.id);
      actions.push(`open_discover_24h → ${row.id}`);
    } else if (sent.error) errors.push(sent.error);
  }

  return { enabled: true, actions, errors };
}
