import { createAdminClient } from "@/lib/supabase/admin";
import {
  AHA_WINDOW_HOURS,
  userReachedAhaV1,
} from "@/lib/analytics/metrics";

export type FunnelCounts = {
  signups: number;
  signupsTalent: number;
  signupsCompany: number;
  onboardingComplete: number;
  profilesCompleted: number;
  connectionsSent: number;
  minglesCreated: number;
  messagesSent: number;
  activeTalents: number;
  activeCompanies: number;
  ahaEligibleSignups: number;
  ahaReached: number;
};

export type FunnelSnapshot = {
  start: string;
  end: string;
  priorStart: string;
  priorEnd: string;
  current: FunnelCounts;
  prior: Pick<
    FunnelCounts,
    "signups" | "connectionsSent" | "minglesCreated" | "messagesSent"
  >;
  source: "supabase" | "unavailable";
  note?: string;
};

function iso(d: Date): string {
  return d.toISOString();
}

function windowBounds(end: Date, days: number) {
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);
  const priorEnd = new Date(start);
  const priorStart = new Date(priorEnd);
  priorStart.setUTCDate(priorStart.getUTCDate() - days);
  return { start, end, priorStart, priorEnd };
}

async function countUsersCreated(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
): Promise<{ total: number; talent: number; company: number }> {
  const { data, error } = await admin
    .from("users")
    .select("id, user_type")
    .gte("created_at", from)
    .lt("created_at", to);
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows.length,
    talent: rows.filter((r) => r.user_type === "talent").length,
    company: rows.filter((r) => r.user_type === "company").length,
  };
}

async function countOnboardingComplete(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
): Promise<number> {
  const { count, error } = await admin
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("onboarding_status", "completed")
    .gte("created_at", from)
    .lt("created_at", to);
  if (error) throw error;
  return count ?? 0;
}

async function countConnections(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
  status?: "accepted" | "pending",
): Promise<number> {
  let q = admin
    .from("connections")
    .select("id", { count: "exact", head: true })
    .gte("created_at", from)
    .lt("created_at", to);
  if (status) q = q.eq("status", status);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function countMessages(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
): Promise<number> {
  const { count, error } = await admin
    .from("messages")
    .select("id", { count: "exact", head: true })
    .gte("created_at", from)
    .lt("created_at", to);
  if (error) throw error;
  return count ?? 0;
}

async function countActiveProfiles(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<{ talents: number; companies: number }> {
  const [talentRes, companyRes] = await Promise.all([
    admin
      .from("talent_profiles")
      .select("user_id", { count: "exact", head: true })
      .not("first_name", "is", null),
    admin
      .from("company_profiles")
      .select("user_id", { count: "exact", head: true })
      .not("company_name", "is", null),
  ]);
  if (talentRes.error) throw talentRes.error;
  if (companyRes.error) throw companyRes.error;
  return {
    talents: talentRes.count ?? 0,
    companies: companyRes.count ?? 0,
  };
}

async function estimateAhaRate(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
): Promise<{ eligible: number; reached: number }> {
  const { data: signups, error } = await admin
    .from("users")
    .select("id, created_at, onboarding_status")
    .gte("created_at", from)
    .lt("created_at", to);
  if (error) throw error;
  const rows = signups ?? [];
  if (rows.length === 0) return { eligible: 0, reached: 0 };

  let reached = 0;
  for (const user of rows) {
    const signupAt = user.created_at;
    const deadline = new Date(signupAt);
    deadline.setUTCHours(deadline.getUTCHours() + AHA_WINDOW_HOURS);

    const profileDone =
      user.onboarding_status === "completed" ? signupAt : null;

    const { data: conns } = await admin
      .from("connections")
      .select("created_at, status")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .lte("created_at", iso(deadline))
      .order("created_at", { ascending: true })
      .limit(1);

    const firstConn = conns?.[0]?.created_at ?? null;
    if (
      userReachedAhaV1({
        signedUpAt: signupAt,
        profileCompletedAt: profileDone,
        firstConnectionOrMingleAt: firstConn,
      })
    ) {
      reached += 1;
    }
  }
  return { eligible: rows.length, reached };
}

async function loadPeriodCounts(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  from: string,
  to: string,
): Promise<FunnelCounts> {
  const [users, onboardingComplete, connections, mingles, messages, actives, aha] =
    await Promise.all([
      countUsersCreated(admin, from, to),
      countOnboardingComplete(admin, from, to),
      countConnections(admin, from, to),
      countConnections(admin, from, to, "accepted"),
      countMessages(admin, from, to),
      countActiveProfiles(admin),
      estimateAhaRate(admin, from, to),
    ]);

  return {
    signups: users.total,
    signupsTalent: users.talent,
    signupsCompany: users.company,
    onboardingComplete,
    profilesCompleted: onboardingComplete,
    connectionsSent: connections,
    minglesCreated: mingles,
    messagesSent: messages,
    activeTalents: actives.talents,
    activeCompanies: actives.companies,
    ahaEligibleSignups: aha.eligible,
    ahaReached: aha.reached,
  };
}

export async function loadFunnelSnapshot(
  windowDays: number,
  end = new Date(),
): Promise<FunnelSnapshot> {
  const { start, end: endDate, priorStart, priorEnd } = windowBounds(
    end,
    windowDays,
  );
  const admin = createAdminClient();
  if (!admin) {
    return {
      start: iso(start),
      end: iso(endDate),
      priorStart: iso(priorStart),
      priorEnd: iso(priorEnd),
      current: emptyCounts(),
      prior: {
        signups: 0,
        connectionsSent: 0,
        minglesCreated: 0,
        messagesSent: 0,
      },
      source: "unavailable",
      note: "SUPABASE_SERVICE_ROLE_KEY unset — funnel counts need a privileged cron runner.",
    };
  }

  const [current, priorPartial] = await Promise.all([
    loadPeriodCounts(admin, iso(start), iso(endDate)),
    (async () => {
      const pStart = iso(priorStart);
      const pEnd = iso(priorEnd);
      const [users, connections, mingles, messages] = await Promise.all([
        countUsersCreated(admin, pStart, pEnd),
        countConnections(admin, pStart, pEnd),
        countConnections(admin, pStart, pEnd, "accepted"),
        countMessages(admin, pStart, pEnd),
      ]);
      return {
        signups: users.total,
        connectionsSent: connections,
        minglesCreated: mingles,
        messagesSent: messages,
      };
    })(),
  ]);

  return {
    start: iso(start),
    end: iso(endDate),
    priorStart: iso(priorStart),
    priorEnd: iso(priorEnd),
    current,
    prior: priorPartial,
    source: "supabase",
  };
}

function emptyCounts(): FunnelCounts {
  return {
    signups: 0,
    signupsTalent: 0,
    signupsCompany: 0,
    onboardingComplete: 0,
    profilesCompleted: 0,
    connectionsSent: 0,
    minglesCreated: 0,
    messagesSent: 0,
    activeTalents: 0,
    activeCompanies: 0,
    ahaEligibleSignups: 0,
    ahaReached: 0,
  };
}
