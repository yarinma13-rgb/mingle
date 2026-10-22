import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPurchasablePlan } from "@/lib/billing/plans";
import { REGION_PRICING, regionForCountry, TRIAL_DAYS } from "@/lib/billing/pricing";
import { appBaseUrl, getStripe, priceIdForPlan } from "@/lib/billing/stripe";

/**
 * Starts Stripe Checkout (subscription mode): the card is collected now but
 * not charged until the 60-day trial ends. Only the company OWNER can buy a
 * plan. Body: { plan: "core"|"plus"|"max", country: "IL" }.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!stripe || !admin) {
    return NextResponse.json({ error: "Billing isn't configured yet." }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: userRow } = await supabase
    .from("users")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle();
  if (userRow?.user_type !== "company") {
    return NextResponse.json({ error: "Only companies can subscribe." }, { status: 403 });
  }

  let body: { plan?: unknown; country?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (!isPurchasablePlan(body.plan)) {
    return NextResponse.json({ error: "Choose Core, Plus or Max." }, { status: 400 });
  }
  const country = typeof body.country === "string" ? body.country.trim().toUpperCase() : "";
  const region = regionForCountry(country);
  if (!region) {
    return NextResponse.json({ error: "Choose your country." }, { status: 400 });
  }
  const priceId = priceIdForPlan(body.plan);
  if (!priceId) {
    return NextResponse.json({ error: "This plan isn't available yet." }, { status: 503 });
  }

  const { data: existing } = await admin
    .from("company_subscriptions")
    .select("stripe_customer_id, status, grandfathered")
    .eq("company_id", user.id)
    .maybeSingle();
  if (existing && (existing.grandfathered || ["trialing", "active", "past_due"].includes(existing.status))) {
    return NextResponse.json({ error: "You already have an active plan." }, { status: 409 });
  }

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { company_id: user.id },
    });
    customerId = customer.id;
  }

  // Row exists from here so the webhook (and the portal) can find the company.
  const { error: upsertError } = await admin.from("company_subscriptions").upsert(
    {
      company_id: user.id,
      plan: body.plan,
      status: "incomplete",
      billing_country: country,
      stripe_customer_id: customerId,
    },
    { onConflict: "company_id" },
  );
  if (upsertError) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  const taxRate = process.env.STRIPE_TAX_RATE_ID?.trim();
  const automaticTax = process.env.STRIPE_AUTOMATIC_TAX === "1";
  const base = appBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    // One Price per plan carries ils/usd/eur currency_options; this picks the region's.
    currency: REGION_PRICING[region].currency,
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        price: priceId,
        quantity: 1,
        ...(taxRate && !automaticTax ? { tax_rates: [taxRate] } : {}),
      },
    ],
    payment_method_collection: "always",
    billing_address_collection: "required",
    ...(automaticTax
      ? { automatic_tax: { enabled: true }, customer_update: { address: "auto" as const } }
      : {}),
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { company_id: user.id, plan: body.plan, billing_country: country },
    },
    metadata: { company_id: user.id, plan: body.plan },
    success_url: `${base}/billing?checkout=success`,
    cancel_url: `${base}/billing/start?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
