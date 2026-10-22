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
expect(regionForCountry("DE") === "EUR" && regionForCountry("fr") === "EUR", "eurozone -> EUR");
expect(regionForCountry("US") === "ROW" && regionForCountry("GB") === "ROW", "rest of world -> USD");
expect(regionForCountry("") === null && regionForCountry("ISR") === null, "invalid country rejected");
expect(priceFor("IL", "core")?.amount === 790, "core ils 790");
expect(priceFor("IL", "plus")?.amount === 1490, "plus ils 1490");
expect(priceFor("IL", "max")?.amount === 2490, "max ils 2490");
expect(priceFor("DE", "core")?.amount === 230 && priceFor("DE", "core")?.currency === "eur", "core eur 230");
expect(priceFor("DE", "plus")?.amount === 430, "plus eur 430");
expect(priceFor("DE", "max")?.amount === 715, "max eur 715");
expect(priceFor("US", "core")?.amount === 255 && priceFor("US", "core")?.currency === "usd", "core usd 255");
expect(priceFor("US", "plus")?.amount === 480, "plus usd 480");
expect(priceFor("US", "max")?.amount === 805, "max usd 805");
// Conversion stays consistent with the documented ECB rate (within rounding to 5).
const ILS_TO_USD = 0.3235, ILS_TO_EUR = 0.28797;
for (const plan of ["core", "plus", "max"] as const) {
  const ils = priceFor("IL", plan)!.amount;
  expect(Math.abs(priceFor("US", plan)!.amount - ils * ILS_TO_USD) <= 2.6, `${plan} usd conversion`);
  expect(Math.abs(priceFor("DE", plan)!.amount - ils * ILS_TO_EUR) <= 2.6, `${plan} eur conversion`);
}

console.log("billing smoke: all checks passed");
