import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { appBaseUrl, getStripe } from "@/lib/billing/stripe";

/** Opens the Stripe customer portal (update card, change plan, cancel). */
export async function POST() {
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

  const { data: sub } = await admin
    .from("company_subscriptions")
    .select("stripe_customer_id")
    .eq("company_id", user.id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account yet." }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appBaseUrl()}/billing`,
  });
  return NextResponse.json({ url: session.url });
}
