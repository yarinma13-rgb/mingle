import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { getStripe, planForPriceId } from "@/lib/billing/stripe";
import { isPurchasablePlan, type SubscriptionStatus } from "@/lib/billing/plans";

type Admin = SupabaseClient<Database>;

/**
 * The ONLY writer of company_subscriptions. Signature-verified and idempotent
 * (Stripe retries; an event id is recorded before it's processed and removed
 * again if processing fails so the retry actually re-runs).
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const admin = createAdminClient();
  if (!stripe || !secret || !admin) {
    return NextResponse.json({ error: "Billing isn't configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature." }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const { error: dedupeError } = await admin
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, type: event.type });
  if (dedupeError) {
    if (dedupeError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: "Could not record event." }, { status: 500 });
  }

  try {
    await handleEvent(stripe, admin, event);
  } catch (error) {
    await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
    console.error("stripe webhook failed", event.type, error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleEvent(stripe: Stripe, admin: Admin, event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(admin, subscription);
      await flagCountryMismatch(admin, session);
      return;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(admin, event.data.object as Stripe.Subscription);
      return;
    default:
      return;
  }
}

function mapStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "incomplete":
      return "incomplete";
    default:
      // canceled, incomplete_expired, paused
      return "canceled";
  }
}

async function findCompanyId(admin: Admin, subscription: Stripe.Subscription): Promise<string | null> {
  const fromMetadata = subscription.metadata?.company_id;
  if (fromMetadata) return fromMetadata;
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const { data } = await admin
    .from("company_subscriptions")
    .select("company_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.company_id ?? null;
}

async function syncSubscription(admin: Admin, subscription: Stripe.Subscription) {
  const companyId = await findCompanyId(admin, subscription);
  if (!companyId) return;

  const { data: existing } = await admin
    .from("company_subscriptions")
    .select("grandfathered, plan")
    .eq("company_id", companyId)
    .maybeSingle();
  // A grandfathered company never has its free access rewritten by Stripe.
  if (existing?.grandfathered) return;

  const item = subscription.items.data[0];
  const plan =
    planForPriceId(item?.price.id) ??
    (isPurchasablePlan(subscription.metadata?.plan) ? subscription.metadata.plan : null) ??
    (isPurchasablePlan(existing?.plan) ? existing.plan : null);
  if (!plan) return;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const { error } = await admin.from("company_subscriptions").upsert(
    {
      company_id: companyId,
      plan,
      status: mapStatus(subscription.status),
      currency: subscription.currency ?? null,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "company_id" },
  );
  if (error) throw error;
}

/**
 * The company picked a country to get that region's price; the billing
 * address entered at Checkout must agree, otherwise flag for manual review
 * rather than silently accepting a cheaper region.
 */
async function flagCountryMismatch(admin: Admin, session: Stripe.Checkout.Session) {
  const companyId = session.client_reference_id ?? session.metadata?.company_id;
  const billingCountry = session.customer_details?.address?.country;
  if (!companyId || !billingCountry) return;

  const { data } = await admin
    .from("company_subscriptions")
    .select("billing_country, grandfathered")
    .eq("company_id", companyId)
    .maybeSingle();
  if (!data || data.grandfathered || !data.billing_country) return;

  if (data.billing_country.toUpperCase() !== billingCountry.toUpperCase()) {
    await admin
      .from("company_subscriptions")
      .update({ needs_review: true })
      .eq("company_id", companyId);
  }
}
