/**
 * Fixed price list per region (not live FX conversion). Amounts are monthly,
 * in major currency units, EXCLUDING VAT/sales tax (added at checkout).
 *
 * Only Israel is priced so far. Other regions are deliberately absent — we
 * don't invent prices; a country with no entry is not purchasable yet and the
 * UI shows "contact us" until the numbers are added here AND as currency
 * options on the Stripe Prices.
 */

import type { PurchasablePlanId } from "@/lib/billing/plans";

export type RegionId = "IL";
export type Currency = "ils";

type RegionPricing = {
  currency: Currency;
  symbol: string;
  monthly: Record<PurchasablePlanId, number>;
};

export const REGION_PRICING: Record<RegionId, RegionPricing> = {
  IL: {
    currency: "ils",
    symbol: "₪",
    monthly: { core: 790, plus: 1490, max: 2490 },
  },
};

const COUNTRY_TO_REGION: Record<string, RegionId> = {
  IL: "IL",
};

/** 2 months free; card is collected up front and charged after the trial. */
export const TRIAL_DAYS = 60;

export function regionForCountry(countryCode: string | null | undefined): RegionId | null {
  if (!countryCode) return null;
  return COUNTRY_TO_REGION[countryCode.trim().toUpperCase()] ?? null;
}

export function priceFor(
  countryCode: string | null | undefined,
  plan: PurchasablePlanId,
): { amount: number; currency: Currency; symbol: string } | null {
  const region = regionForCountry(countryCode);
  if (!region) return null;
  const pricing = REGION_PRICING[region];
  return {
    amount: pricing.monthly[plan],
    currency: pricing.currency,
    symbol: pricing.symbol,
  };
}
