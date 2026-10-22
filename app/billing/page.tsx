import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalButton } from "@/components/billing/PortalButton";
import { billingEnabled, loadCompanyBilling, loadPlanUsage } from "@/lib/billing/access";
import { planLimits } from "@/lib/billing/plans";
import { requireAppUser } from "@/lib/dashboard/require-shell-user";
import { resolveCompanyWorkspaceId } from "@/lib/team/persistence";

const PLAN_NAME = { core: "Core", plus: "Plus", max: "Max", enterprise: "Enterprise" } as const;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-mingle-text">{label}</span>
        <span className="text-mingle-text-secondary">
          {used} / {limit ?? "unlimited"}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-mingle-surface">
        <div className="h-full rounded-full bg-mingle-purple" style={{ width: `${limit ? pct : 0}%` }} />
      </div>
    </div>
  );
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const { checkout } = await searchParams;
  const { supabase, user, isCompany } = await requireAppUser({ skipBillingGate: true });
  if (!isCompany || !billingEnabled()) redirect("/dashboard");

  const companyId = await resolveCompanyWorkspaceId(supabase, user.id);
  const isOwner = companyId === user.id;
  const billing = await loadCompanyBilling(supabase, companyId);

  if (billing.state !== "ok" || billing.status === "incomplete") {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-mingle-border bg-mingle-surface p-7 text-center shadow-mingle">
        <h1 className="font-display text-lg font-semibold text-mingle-text">Choose a plan</h1>
        <p className="mt-2 text-sm text-mingle-text-secondary">
          {checkout === "success"
            ? "Thanks! Your plan is being activated — refresh in a moment."
            : "Pick a plan to get started. The first 2 months are free."}
        </p>
        <Link href="/billing/start" className="mingle-btn-primary mt-5 inline-block text-sm">
          See plans
        </Link>
      </div>
    );
  }

  const usage = await loadPlanUsage(supabase, companyId, billing.effectivePlan);
  const limits = planLimits(billing.effectivePlan);

  const statusLine = billing.grandfathered
    ? "You're on a free legacy plan with everything included. Nothing is charged."
    : billing.status === "trialing"
      ? `Free trial — your first charge is on ${formatDate(billing.trialEndsAt)}.`
      : billing.status === "active"
        ? billing.cancelAtPeriodEnd
          ? `Active until ${formatDate(billing.currentPeriodEnd)}, then it ends.`
          : `Active — renews on ${formatDate(billing.currentPeriodEnd)}.`
        : billing.status === "past_due"
          ? "Your last payment didn't go through. Update your card to avoid losing access."
          : "Your plan isn't active. Reactivate it to keep using mingle.";

  return (
    <div className="mx-auto mt-6 flex max-w-xl flex-col gap-6">
      {checkout === "success" ? (
        <p className="rounded-xl border border-mingle-success/30 bg-mingle-success/10 px-4 py-3 text-sm text-mingle-text">
          You&apos;re all set — welcome to mingle {PLAN_NAME[billing.plan]}.
        </p>
      ) : null}

      {!billing.hasAccess ? (
        <p role="alert" className="rounded-xl border border-mingle-error/30 bg-mingle-error/10 px-4 py-3 text-sm text-mingle-error">
          Access to your workspace is paused until billing is sorted out. Your data is safe.
        </p>
      ) : null}

      <section className="rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
        <p className="text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">Your plan</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-mingle-text">
          {billing.grandfathered ? "Legacy (free)" : PLAN_NAME[billing.plan]}
        </h1>
        <p className="mt-2 text-sm text-mingle-text-secondary">{statusLine}</p>

        <div className="mt-6 flex flex-col gap-4">
          <Meter label="Active jobs" used={usage.activeJobs} limit={limits.activeJobs} />
          <Meter label="Team users" used={usage.teamUsers} limit={limits.teamUsers} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {isOwner && !billing.grandfathered ? (
            <PortalButton label={billing.hasAccess ? "Manage billing" : "Fix billing"} />
          ) : null}
          {isOwner && billing.grandfathered ? (
            <Link href="/billing/start" className="mingle-btn-secondary text-sm">
              See paid plans
            </Link>
          ) : null}
          {!isOwner ? (
            <p className="text-xs text-mingle-text-secondary">Only the account owner can change the plan.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
