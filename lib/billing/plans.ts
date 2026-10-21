/**
 * Single source of truth for what each plan includes. Every limit/feature
 * gate in the app calls these helpers — never hard-code a number elsewhere.
 * Enterprise is sales-led (no self-serve checkout) and unlimited.
 */

export type PlanId = "core" | "plus" | "max" | "enterprise";
export type PurchasablePlanId = Exclude<PlanId, "enterprise">;

export const PURCHASABLE_PLANS: PurchasablePlanId[] = ["core", "plus", "max"];

export type PlanFeature =
  | "candidate_comparison"
  | "talent_pool"
  | "advanced_reporting"
  | "talent_exchange"
  | "interview_intelligence"
  | "company_insights"
  | "advanced_analytics";

export type PlanLimits = {
  /** null = unlimited */
  activeJobs: number | null;
  teamUsers: number | null;
};

const LIMITS: Record<PlanId, PlanLimits> = {
  core: { activeJobs: 3, teamUsers: 3 },
  plus: { activeJobs: 10, teamUsers: 10 },
  max: { activeJobs: 25, teamUsers: 25 },
  enterprise: { activeJobs: null, teamUsers: null },
};

const PLUS_FEATURES: PlanFeature[] = [
  "candidate_comparison",
  "talent_pool",
  "advanced_reporting",
];
const MAX_FEATURES: PlanFeature[] = [
  ...PLUS_FEATURES,
  "talent_exchange",
  "interview_intelligence",
  "company_insights",
  "advanced_analytics",
];

const FEATURES: Record<PlanId, ReadonlySet<PlanFeature>> = {
  core: new Set(),
  plus: new Set(PLUS_FEATURES),
  max: new Set(MAX_FEATURES),
  enterprise: new Set(MAX_FEATURES),
};

export function planLimits(plan: PlanId): PlanLimits {
  return LIMITS[plan];
}

export function planHas(plan: PlanId, feature: PlanFeature): boolean {
  return FEATURES[plan].has(feature);
}

/** Whether `current` more items would still fit under `limit` (null = no cap). */
export function withinLimit(limit: number | null, current: number): boolean {
  return limit === null || current < limit;
}

export function isPurchasablePlan(value: unknown): value is PurchasablePlanId {
  return value === "core" || value === "plus" || value === "max";
}

/** Subscription statuses that keep the product usable. */
export type SubscriptionStatus =
  | "incomplete"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid";

/** past_due keeps access (Stripe is still retrying the card); the rest lock. */
export function statusAllowsAccess(status: SubscriptionStatus): boolean {
  return status === "trialing" || status === "active" || status === "past_due";
}
