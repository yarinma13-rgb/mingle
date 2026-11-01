/**
 * Marketing copy and comparison rows for the plans. Numbers and feature
 * availability that the product actually enforces come from plans.ts
 * (`planLimits` / `planHas`) so this page can never promise something the
 * gates don't deliver; everything else here is descriptive copy.
 */

import {
  planHas,
  planLimits,
  type PlanFeature,
  type PlanId,
  type PurchasablePlanId,
} from "@/lib/billing/plans";

export const ENTERPRISE_BOOKING_URL = "https://calendly.com/yarinma13/30min";

export type PlanCopy = {
  name: string;
  tagline: string;
  /** Short capacity line shown under the price. */
  jobs: string;
  /** Previous plan this one builds on ("Includes Core, plus:"). */
  includes: string | null;
  highlights: string[];
  popular?: boolean;
};

export const PLAN_COPY: Record<PurchasablePlanId, PlanCopy> = {
  core: {
    name: "Core",
    tagline: "For lean hiring teams getting started.",
    jobs: "1–3 active jobs",
    includes: null,
    highlights: [
      "AI matching (Role, Human, Motivation fit)",
      "Why match / Why not insights",
      "Candidate pipeline & basic ATS",
      "Calendar integration",
      "Team collaboration (up to 3 users)",
      "Basic reporting",
      "Standard support",
    ],
  },
  plus: {
    name: "Plus",
    tagline: "For growing teams with more hiring needs.",
    jobs: "4–10 active jobs",
    includes: "Core",
    highlights: [
      "Candidate comparison",
      "Talent pool (save & reuse candidates)",
      "Recruitment analytics",
      "Advanced reporting",
      "Expanded hiring team (up to 10 users)",
      "Priority support",
    ],
  },
  max: {
    name: "Max",
    tagline: "For high-volume teams that need advanced intelligence.",
    jobs: "11–25 active jobs",
    includes: "Plus",
    highlights: [
      "Interview intelligence",
      "Talent rediscovery (Talent Exchange)",
      "Company insights",
      "Advanced analytics & dashboards",
      "Expanded hiring team (up to 25 users)",
      "Dedicated success manager",
    ],
    popular: true,
  },
};

export const ENTERPRISE_COPY = {
  name: "Enterprise",
  tagline: "For organisations hiring at scale with custom needs.",
  jobs: "25+ active jobs",
  includes: "Max",
  highlights: [
    "Unlimited jobs & team members",
    "Custom workflows & automations",
    "Single sign-on (SSO)",
    "Custom AI models",
    "Service-level agreement (SLA)",
    "Dedicated success manager",
  ],
};

type Cell = string | boolean;
export type CompareRow = { label: string; values: Record<PlanId, Cell> };
export type CompareGroup = { title: string; rows: CompareRow[] };

const ALL: PlanId[] = ["core", "plus", "max", "enterprise"];

function allPlans(value: Cell): Record<PlanId, Cell> {
  return { core: value, plus: value, max: value, enterprise: value };
}

/** Availability driven by the real gate, so the table matches the product. */
function gated(feature: PlanFeature): Record<PlanId, Cell> {
  return Object.fromEntries(ALL.map((plan) => [plan, planHas(plan, feature)])) as Record<PlanId, Cell>;
}

function limit(kind: "activeJobs" | "teamUsers"): Record<PlanId, Cell> {
  return Object.fromEntries(
    ALL.map((plan) => {
      const value = planLimits(plan)[kind];
      return [plan, value === null ? "Unlimited" : `Up to ${value}`];
    }),
  ) as Record<PlanId, Cell>;
}

export const COMPARE_GROUPS: CompareGroup[] = [
  {
    title: "Capacity",
    rows: [
      { label: "Active jobs", values: limit("activeJobs") },
      { label: "Team members", values: limit("teamUsers") },
    ],
  },
  {
    title: "Matching & pipeline",
    rows: [
      { label: "AI matching (Role, Human, Motivation fit)", values: allPlans(true) },
      { label: "Why match / Why not insights", values: allPlans(true) },
      { label: "Candidate pipeline & basic ATS", values: allPlans(true) },
      { label: "Calendar integration", values: allPlans(true) },
      { label: "Candidate comparison", values: gated("candidate_comparison") },
      { label: "Talent pool (save & reuse candidates)", values: gated("talent_pool") },
      { label: "Talent rediscovery (Talent Exchange)", values: gated("talent_exchange") },
    ],
  },
  {
    title: "Reporting & intelligence",
    rows: [
      { label: "Basic reporting", values: allPlans(true) },
      { label: "Recruitment analytics & advanced reporting", values: gated("advanced_reporting") },
      { label: "Interview intelligence", values: gated("interview_intelligence") },
      { label: "Company insights", values: gated("company_insights") },
      { label: "Advanced analytics & dashboards", values: gated("advanced_analytics") },
    ],
  },
  {
    title: "Support & services",
    rows: [
      {
        label: "Support",
        values: { core: "Standard", plus: "Priority", max: "Priority", enterprise: "Priority + SLA" },
      },
      {
        label: "Dedicated success manager",
        values: { core: false, plus: false, max: true, enterprise: true },
      },
      {
        label: "Custom workflows & automations",
        values: { core: false, plus: false, max: false, enterprise: true },
      },
      { label: "Single sign-on (SSO)", values: { core: false, plus: false, max: false, enterprise: true } },
      { label: "Custom AI models", values: { core: false, plus: false, max: false, enterprise: true } },
    ],
  },
];

export const PLAN_FAQ: { q: string; a: string }[] = [
  {
    q: "How does the free trial work?",
    a: "Your first 2 months are free. You add a card when you choose a plan, but you are not charged until the trial ends. We email you about a week before the first charge, and you can cancel any time before then at no cost.",
  },
  {
    q: "What do the prices include?",
    a: "Prices are per month and exclude VAT or sales tax, which is added at checkout where it applies. The price you see follows your billing country and is shown in shekels, euros or US dollars.",
  },
  {
    q: "What happens when I reach my plan's limit?",
    a: "You keep everything you already have. To open another job or add another team member beyond your plan, you'll be asked to upgrade. Nothing is deleted if you stay at the limit or move to a smaller plan.",
  },
  {
    q: "Can I change or cancel my plan?",
    a: "Yes. You can upgrade, downgrade, update your card or cancel at any time from the billing page. Cancellation takes effect at the end of the current billing period.",
  },
  {
    q: "What counts as an active job?",
    a: "A role with the status Open. Paused and closed roles don't count toward your limit.",
  },
  {
    q: "Do you offer custom plans?",
    a: "Yes. If you need more than 25 active jobs, SSO, custom workflows or a custom SLA, book a short call and we'll put together an Enterprise plan.",
  },
];
