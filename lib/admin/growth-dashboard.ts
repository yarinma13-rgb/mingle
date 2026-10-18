import { createAdminClient } from "@/lib/supabase/admin";
import { loadFunnelSnapshot, type FunnelSnapshot } from "@/lib/analytics/funnel-snapshot";
import type { AcquisitionChannel } from "@/lib/analytics/acquisition-channel";

export type AcquisitionBreakdownRow = {
  channel: AcquisitionChannel | "unknown";
  count: number;
};

export type CampaignBreakdownRow = {
  campaign: string;
  signups: number;
  onboarded: number;
};

export type GrowthDashboardData = {
  snapshot: FunnelSnapshot;
  activationRate: number;
  referralSignups: number;
  returningUsers: number;
  acquisitionBreakdown: AcquisitionBreakdownRow[];
  campaignBreakdown: CampaignBreakdownRow[];
};

const ALL_CHANNELS: (AcquisitionChannel | "unknown")[] = [
  "linkedin",
  "instagram",
  "facebook",
  "referral",
  "company_outreach",
  "organic",
  "direct",
  "other",
  "unknown",
];

export async function loadGrowthDashboardData(
  windowDays: number,
): Promise<GrowthDashboardData> {
  const snapshot = await loadFunnelSnapshot(windowDays);
  const admin = createAdminClient();
  if (!admin) {
    return {
      snapshot,
      activationRate: 0,
      referralSignups: 0,
      returningUsers: 0,
      acquisitionBreakdown: [],
      campaignBreakdown: [],
    };
  }

  const activationRate =
    snapshot.current.ahaEligibleSignups > 0
      ? Math.round(
          (snapshot.current.ahaReached / snapshot.current.ahaEligibleSignups) *
            100,
        )
      : 0;

  const { count: referralSignups } = await admin
    .from("role_referrals")
    .select("id", { count: "exact", head: true })
    .not("referred_user_id", "is", null)
    .gte("created_at", snapshot.start)
    .lt("created_at", snapshot.end);

  // Returning: signed up before the window, but active inside it.
  const { count: returningUsers } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .lt("created_at", snapshot.start)
    .gte("last_active_at", snapshot.start)
    .lt("last_active_at", snapshot.end);

  const { data: channelRows } = await admin
    .from("users")
    .select("acquisition_channel")
    .gte("created_at", snapshot.start)
    .lt("created_at", snapshot.end);

  const counts = new Map<string, number>();
  for (const row of channelRows ?? []) {
    const key = row.acquisition_channel ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const acquisitionBreakdown: AcquisitionBreakdownRow[] = ALL_CHANNELS.map(
    (channel) => ({
      channel,
      count: counts.get(channel) ?? 0,
    }),
  ).filter((row) => row.count > 0);

  // Separate query: if migration 0049 isn't applied yet this errors alone and
  // the channel breakdown above is unaffected.
  const { data: campaignRows } = await admin
    .from("users")
    .select("acquisition_campaign, onboarding_status")
    .not("acquisition_campaign", "is", null)
    .gte("created_at", snapshot.start)
    .lt("created_at", snapshot.end);

  const campaigns = new Map<string, CampaignBreakdownRow>();
  for (const row of campaignRows ?? []) {
    if (!row.acquisition_campaign) continue;
    const entry = campaigns.get(row.acquisition_campaign) ?? {
      campaign: row.acquisition_campaign,
      signups: 0,
      onboarded: 0,
    };
    entry.signups += 1;
    if (row.onboarding_status === "completed") entry.onboarded += 1;
    campaigns.set(row.acquisition_campaign, entry);
  }
  const campaignBreakdown = [...campaigns.values()].sort(
    (a, b) => b.signups - a.signups,
  );

  return {
    snapshot,
    activationRate,
    referralSignups: referralSignups ?? 0,
    returningUsers: returningUsers ?? 0,
    acquisitionBreakdown,
    campaignBreakdown,
  };
}
