import Stripe from "stripe";
import type { PurchasablePlanId } from "@/lib/billing/plans";

/**
 * Server-only Stripe client. Returns null when STRIPE_SECRET_KEY is unset
 * (local / preview without billing configured) so callers can answer 503
 * instead of crashing. Card data never reaches our servers: payment details
 * are collected on Stripe-hosted Checkout.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key);
}

export function priceIdForPlan(plan: PurchasablePlanId): string | null {
  const id =
    plan === "core"
      ? process.env.STRIPE_PRICE_CORE
      : plan === "plus"
        ? process.env.STRIPE_PRICE_PLUS
        : process.env.STRIPE_PRICE_MAX;
  return id?.trim() || null;
}

export function planForPriceId(priceId: string | null | undefined): PurchasablePlanId | null {
  if (!priceId) return null;
  const plans: PurchasablePlanId[] = ["core", "plus", "max"];
  return plans.find((plan) => priceIdForPlan(plan) === priceId) ?? null;
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}
