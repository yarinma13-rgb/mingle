import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  planHas,
  planLimits,
  statusAllowsAccess,
  type PlanFeature,
  type PlanId,
  type SubscriptionStatus,
} from "@/lib/billing/plans";

/**
 * Billing is "on" only when Stripe is actually configured. Until then the
 * whole product behaves exactly as it did before billing existed — deploying
 * this code (or running the migration) can never lock anyone out by itself.
 */
export function billingEnabled(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() && process.env.STRIPE_PRICE_CORE?.trim(),
  );
}

export type CompanyBilling =
  | { state: "unavailable" }
  | { state: "none" }
  | {
      state: "ok";
      /** What the company bought; null for grandfathered legacy rows. */
      plan: Exclude<PlanId, "enterprise">;
      /** What the limits/features are computed from (grandfathered = unlimited). */
      effectivePlan: PlanId;
      status: SubscriptionStatus;
      grandfathered: boolean;
      hasAccess: boolean;
      trialEndsAt: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      needsReview: boolean;
      billingCountry: string | null;
      currency: string | null;
    };

function isMissingTable(error: { message?: string; code?: string }) {
  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("company_subscriptions") &&
      (message.includes("does not exist") || message.includes("schema cache")))
  );
}

export async function loadCompanyBilling(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<CompanyBilling> {
  const { data, error } = await supabase
    .from("company_subscriptions")
    .select(
      "plan, status, grandfathered, trial_ends_at, current_period_end, cancel_at_period_end, needs_review, billing_country, currency",
    )
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return { state: "unavailable" };
    throw error;
  }
  if (!data) return { state: "none" };

  return {
    state: "ok",
    plan: data.plan,
    effectivePlan: data.grandfathered ? "enterprise" : data.plan,
    status: data.status,
    grandfathered: data.grandfathered,
    hasAccess: data.grandfathered || statusAllowsAccess(data.status),
    trialEndsAt: data.trial_ends_at,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    needsReview: data.needs_review,
    billingCountry: data.billing_country,
    currency: data.currency,
  };
}

/** True when the feature is available (always true while billing is off). */
export async function companyHasFeature(
  supabase: SupabaseClient<Database>,
  companyId: string,
  feature: PlanFeature,
): Promise<boolean> {
  if (!billingEnabled()) return true;
  const billing = await loadCompanyBilling(supabase, companyId);
  if (billing.state !== "ok") return true;
  return planHas(billing.effectivePlan, feature);
}

export type PlanUsage = {
  activeJobs: number;
  teamUsers: number;
  limits: ReturnType<typeof planLimits>;
};

/** Current usage against a plan's limits (owner counts as one team user). */
export async function loadPlanUsage(
  supabase: SupabaseClient<Database>,
  companyId: string,
  plan: PlanId,
): Promise<PlanUsage> {
  const [{ count: jobs }, { count: members }] = await Promise.all([
    supabase
      .from("roles")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .eq("status", "open"),
    supabase
      .from("company_members")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId)
      .in("status", ["active", "invited"]),
  ]);
  return {
    activeJobs: jobs ?? 0,
    teamUsers: (members ?? 0) + 1,
    limits: planLimits(plan),
  };
}
