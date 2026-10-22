import { createAdminClient } from "@/lib/supabase/admin";
import { sendTrialReminderEmail } from "@/lib/email/billing-trial-reminder";
import { billingEnabled } from "@/lib/billing/access";
import { priceFor } from "@/lib/billing/pricing";

export type TrialReminderRunResult = {
  enabled: boolean;
  sent: number;
  errors: string[];
};

const NUDGE_TYPE = "billing_trial_reminder";
const REMINDER_DAYS_BEFORE = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const PLAN_LABEL = { core: "Core", plus: "Plus", max: "Max" } as const;

/**
 * Daily: emails owners whose trial ends 6-7 days from now (a 24h window, so
 * each trial is picked up once). Dedupe via growth_nudge_log as a second
 * guard against manual re-runs. Skips cancelled and grandfathered rows.
 */
export async function runTrialReminders(): Promise<TrialReminderRunResult> {
  const admin = createAdminClient();
  if (!billingEnabled() || !admin) {
    return {
      enabled: false,
      sent: 0,
      errors: billingEnabled() && !admin ? ["SUPABASE_SERVICE_ROLE_KEY missing"] : [],
    };
  }

  const errors: string[] = [];
  let sent = 0;
  const now = Date.now();
  const from = new Date(now + (REMINDER_DAYS_BEFORE - 1) * DAY_MS).toISOString();
  const to = new Date(now + REMINDER_DAYS_BEFORE * DAY_MS).toISOString();

  const { data: rows, error } = await admin
    .from("company_subscriptions")
    .select("company_id, plan, billing_country, trial_ends_at")
    .eq("status", "trialing")
    .eq("grandfathered", false)
    .eq("cancel_at_period_end", false)
    .gt("trial_ends_at", from)
    .lte("trial_ends_at", to);
  if (error) {
    return { enabled: true, sent: 0, errors: [error.message] };
  }

  for (const row of rows ?? []) {
    if (!row.trial_ends_at) continue;

    const { count: alreadySent } = await admin
      .from("growth_nudge_log")
      .select("id", { count: "exact", head: true })
      .eq("user_id", row.company_id)
      .eq("nudge_type", NUDGE_TYPE)
      .gte("sent_at", new Date(now - 3 * DAY_MS).toISOString());
    if ((alreadySent ?? 0) > 0) continue;

    const { data: owner } = await admin
      .from("users")
      .select("email")
      .eq("id", row.company_id)
      .maybeSingle();
    if (!owner?.email) continue;

    const price = priceFor(row.billing_country, row.plan);
    const result = await sendTrialReminderEmail({
      to: owner.email,
      planLabel: PLAN_LABEL[row.plan],
      priceLabel: price ? `${price.symbol}${price.amount.toLocaleString("en-US")}` : "the plan price",
      chargeDateLabel: new Date(row.trial_ends_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });

    if (result.ok) {
      sent += 1;
      await admin
        .from("growth_nudge_log")
        .insert({ user_id: row.company_id, nudge_type: NUDGE_TYPE });
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  return { enabled: true, sent, errors };
}
