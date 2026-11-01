import type { Metadata } from "next";
import { headers } from "next/headers";
import { PlansShowcase } from "@/components/billing/PlansShowcase";
import { billingEnabled, loadCompanyBilling } from "@/lib/billing/access";
import { regionForCountry } from "@/lib/billing/pricing";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

export const metadata: Metadata = {
  title: "Plans — mingle",
  robots: { index: false, follow: false },
};

/** Plans & pricing — visible to company accounts only (never to candidates). */
export default async function PlansPage() {
  // Browsing plans must work before a plan is chosen, so skip the billing gate.
  const { supabase, user } = await requireAppUser({ userType: "company", skipBillingGate: true });
  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const billing = await loadCompanyBilling(supabase, companyId);

  const guess = (await headers()).get("x-vercel-ip-country");
  const country = billing.state === "ok" && billing.billingCountry ? billing.billingCountry : guess;
  const defaultRegion = regionForCountry(country) ?? "IL";

  const hasPlan = billing.state === "ok" && !billing.grandfathered && billing.hasAccess;

  return (
    <PlansShowcase
      defaultRegion={defaultRegion}
      viewer={{
        checkoutAvailable: billingEnabled(),
        isOwner: companyId === user.id,
        grandfathered: billing.state === "ok" && billing.grandfathered,
        currentPlan: hasPlan && billing.state === "ok" ? billing.plan : null,
      }}
    />
  );
}
