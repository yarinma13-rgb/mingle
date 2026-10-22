import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PlanPicker } from "@/components/billing/PlanPicker";
import { billingEnabled, loadCompanyBilling } from "@/lib/billing/access";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

export default async function BillingStartPage() {
  const { supabase, user, isCompany } = await requireAppUser({ skipBillingGate: true });
  if (!isCompany || !billingEnabled()) redirect("/dashboard");

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const billing = await loadCompanyBilling(supabase, companyId);
  if (billing.state === "ok" && billing.hasAccess) redirect("/billing");

  // Only the account owner can start a subscription.
  if (companyId !== user.id) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-2xl border border-mingle-border bg-mingle-surface p-7 text-center shadow-mingle">
        <h1 className="font-display text-lg font-semibold text-mingle-text">Your workspace needs a plan</h1>
        <p className="mt-2 text-sm text-mingle-text-secondary">
          Ask the account owner to choose a plan. You&apos;ll get access as soon as they do.
        </p>
      </div>
    );
  }

  const guess = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "";
  return <PlanPicker defaultCountry={guess} />;
}
