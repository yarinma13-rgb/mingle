/**
 * Pure checks for the billing rules (no Stripe/DB).
 * Run: npx --yes tsx lib/billing/billing.smoke.ts
 */
import {
  planHas,
  planLimits,
  statusAllowsAccess,
  withinLimit,
  type PlanFeature,
} from "@/lib/billing/plans";
import { priceFor, regionForCountry } from "@/lib/billing/pricing";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

expect(planLimits("core").activeJobs === 3 && planLimits("core").teamUsers === 3, "core limits");
expect(planLimits("plus").activeJobs === 10, "plus jobs");
expect(planLimits("max").activeJobs === 25 && planLimits("max").teamUsers === 25, "max limits");
expect(planLimits("enterprise").activeJobs === null, "enterprise unlimited");

expect(withinLimit(3, 2) === true, "3rd job allowed on core");
expect(withinLimit(3, 3) === false, "4th job blocked on core");
expect(withinLimit(null, 9999) === true, "unlimited never blocks");

const matrix: [PlanFeature, boolean, boolean, boolean][] = [
  ["candidate_comparison", false, true, true],
  ["talent_pool", false, true, true],
  ["advanced_reporting", false, true, true],
  ["talent_exchange", false, false, true],
  ["interview_intelligence", false, false, true],
  ["advanced_analytics", false, false, true],
];
for (const [feature, core, plus, max] of matrix) {
  expect(planHas("core", feature) === core, `core ${feature}`);
  expect(planHas("plus", feature) === plus, `plus ${feature}`);
  expect(planHas("max", feature) === max, `max ${feature}`);
  expect(planHas("enterprise", feature) === max, `enterprise ${feature}`);
}

expect(statusAllowsAccess("trialing") && statusAllowsAccess("active"), "trialing/active ok");
expect(statusAllowsAccess("past_due"), "past_due keeps access");
expect(!statusAllowsAccess("canceled") && !statusAllowsAccess("unpaid"), "canceled/unpaid lock");
expect(!statusAllowsAccess("incomplete"), "incomplete (no card yet) locks");

expect(regionForCountry("il") === "IL", "IL region, case-insensitive");
expect(regionForCountry("US") === null, "unpriced country is not purchasable");
expect(priceFor("IL", "core")?.amount === 790, "core ils 790");
expect(priceFor("IL", "plus")?.amount === 1490, "plus ils 1490");
expect(priceFor("IL", "max")?.amount === 2490, "max ils 2490");
expect(priceFor("DE", "core") === null, "no invented prices for other regions");

console.log("billing smoke: all checks passed");
