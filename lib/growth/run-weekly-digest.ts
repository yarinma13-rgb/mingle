import { createAdminClient } from "@/lib/supabase/admin";
import { sendWeeklyDigestEmail } from "@/lib/email/weekly-digest";
import { WEEKLY_DIGEST_WINDOW_DAYS } from "@/lib/analytics/metrics";

export type WeeklyDigestRunResult = {
  enabled: boolean;
  sent: number;
  errors: string[];
};

const NUDGE_TYPE = "weekly_digest";

function daysAgo(d: number): string {
  return new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Weekly digest — "Your mingle this week". Runs on its own weekly cron.
 * Dedupe via growth_nudge_log (migration 0040) so a manual re-run or an
 * overlapping schedule can't double-send within the same week.
 */
export async function runWeeklyDigest(): Promise<WeeklyDigestRunResult> {
  const enabled = process.env.GROWTH_NUDGES_ENABLED?.trim() === "1";
  const admin = createAdminClient();
  if (!enabled || !admin) {
    return {
      enabled: false,
      sent: 0,
      errors: enabled && !admin ? ["SUPABASE_SERVICE_ROLE_KEY missing"] : [],
    };
  }

  const errors: string[] = [];
  let sent = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://mingle.careers";
  const windowStart = daysAgo(WEEKLY_DIGEST_WINDOW_DAYS);

  const { data: activeUsers, error: usersErr } = await admin
    .from("users")
    .select("id, email, user_type, profile_completion")
    .eq("onboarding_status", "completed")
    .limit(500);
  if (usersErr) errors.push(usersErr.message);

  const { count: newTalentCount } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("user_type", "talent")
    .eq("onboarding_status", "completed")
    .gte("created_at", windowStart);

  const { count: newCompanyCount } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("user_type", "company")
    .eq("onboarding_status", "completed")
    .gte("created_at", windowStart);

  for (const row of activeUsers ?? []) {
    if (!row.email) continue;

    const { count: recentlySent } = await admin
      .from("growth_nudge_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.id)
      .eq("nudge_type", NUDGE_TYPE)
      .gte("sent_at", daysAgo(WEEKLY_DIGEST_WINDOW_DAYS - 1));
    if ((recentlySent ?? 0) > 0) continue;

    const newPotentialMatches =
      row.user_type === "talent" ? (newCompanyCount ?? 0) : (newTalentCount ?? 0);

    const profileInsight =
      row.profile_completion < 100
        ? `Your profile is ${row.profile_completion}% complete — finishing it helps Discover surface better matches.`
        : null;

    const result = await sendWeeklyDigestEmail({
      to: row.email,
      newPotentialMatches,
      profileInsight,
      discoverUrl: `${appUrl}/discover?ntf=weekly_digest`,
    });

    if (result.ok) {
      sent += 1;
      await admin
        .from("growth_nudge_log")
        .insert({ user_id: row.id, nudge_type: NUDGE_TYPE });
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { enabled: true, sent, errors };
}
