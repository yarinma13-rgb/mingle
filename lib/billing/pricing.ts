/**
 * Fixed price list per region (not live FX conversion). Amounts are monthly,
 * in major currency units, EXCLUDING VAT/sales tax (added at checkout).
 *
 * Israel is the base list (ILS). USD and EUR are the ILS prices converted at
 * the ECB reference rate of 2026-10-21 (1 ILS = 0.3235 USD = 0.28797 EUR) and
 * rounded to the nearest 5:
 *   core 790 ILS  = 255.6 USD / 227.5 EUR  -> 255 / 230
 *   plus 1490 ILS = 482.0 USD / 429.1 EUR  -> 480 / 430
 *   max 2490 ILS  = 805.5 USD / 717.1 EUR  -> 805 / 715
 * Re-run this conversion (and update the Stripe Prices' currency_options to
 * match) whenever the list should follow the exchange rate.
 *
 * Eurozone countries pay in EUR; every other country (US, UK, ...) pays in USD.
 */

import type { PurchasablePlanId } from "@/lib/billing/plans";

export type RegionId = "IL" | "EUR" | "ROW";
export type Currency = "ils" | "eur" | "usd";

type RegionPricing = {
  currency: Currency;
  symbol: string;
  monthly: Record<PurchasablePlanId, number>;
};

export const REGION_PRICING: Record<RegionId, RegionPricing> = {
  IL: { currency: "ils", symbol: "₪", monthly: { core: 790, plus: 1490, max: 2490 } },
  EUR: { currency: "eur", symbol: "€", monthly: { core: 230, plus: 430, max: 715 } },
  ROW: { currency: "usd", symbol: "$", monthly: { core: 255, plus: 480, max: 805 } },
};

const EUROZONE = new Set([
  "AT", "BE", "BG", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

/** 2 months free; card is collected up front and charged after the trial. */
export const TRIAL_DAYS = 60;

export function regionForCountry(countryCode: string | null | undefined): RegionId | null {
  const code = countryCode?.trim().toUpperCase();
  if (!code || !/^[A-Z]{2}$/.test(code)) return null;
  if (code === "IL") return "IL";
  if (EUROZONE.has(code)) return "EUR";
  return "ROW";
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
