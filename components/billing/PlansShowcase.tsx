"use client";

import Link from "next/link";
import { useState } from "react";
import {
  COMPARE_GROUPS,
  ENTERPRISE_BOOKING_URL,
  ENTERPRISE_COPY,
  PLAN_COPY,
  PLAN_FAQ,
} from "@/lib/billing/plan-catalog";
import { PURCHASABLE_PLANS, type PlanId, type PurchasablePlanId } from "@/lib/billing/plans";
import { REGION_PRICING, TRIAL_DAYS, type RegionId } from "@/lib/billing/pricing";

export type PlansViewer = {
  /** True when billing is configured, so choosing a plan can open checkout. */
  checkoutAvailable: boolean;
  /** Only the account owner can buy or change a plan. */
  isOwner: boolean;
  /** Legacy companies keep full access at no charge. */
  grandfathered: boolean;
  /** The plan the company is on today (null = none yet). */
  currentPlan: PurchasablePlanId | null;
};

const REGION_CHIPS: { id: RegionId; label: string }[] = [
  { id: "IL", label: "₪ ILS" },
  { id: "EUR", label: "€ EUR" },
  { id: "ROW", label: "$ USD" },
];

function money(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
    >
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Dash() {
  return (
    <span aria-label="Not included" className="text-mingle-text-secondary/50">
      —
    </span>
  );
}

function PlanCta({ plan, viewer }: { plan: PurchasablePlanId; viewer: PlansViewer }) {
  const popular = PLAN_COPY[plan].popular;
  const primary = popular ? "mingle-btn-primary" : "mingle-btn-secondary";
  const base = `${primary} w-full text-center`;

  if (viewer.grandfathered) {
    return (
      <p className="rounded-full bg-mingle-lavender px-3 py-2 text-center text-xs font-semibold text-mingle-purple">
        Included in your account
      </p>
    );
  }
  if (viewer.currentPlan === plan) {
    return (
      <p className="rounded-full border border-mingle-purple px-3 py-2 text-center text-xs font-semibold text-mingle-purple">
        Your current plan
      </p>
    );
  }
  if (!viewer.checkoutAvailable) {
    return (
      <p className="rounded-full bg-mingle-bg px-3 py-2 text-center text-xs font-medium text-mingle-text-secondary">
        Available soon
      </p>
    );
  }
  if (!viewer.isOwner) {
    return (
      <p className="rounded-full bg-mingle-bg px-3 py-2 text-center text-xs font-medium text-mingle-text-secondary">
        Ask your account owner
      </p>
    );
  }
  if (viewer.currentPlan) {
    return (
      <Link href="/billing" className={base}>
        Change plan
      </Link>
    );
  }
  return (
    <Link href="/billing/start" className={base}>
      Start {TRIAL_DAYS / 30}-month free trial
    </Link>
  );
}

export function PlansShowcase({
  viewer,
  defaultRegion,
}: {
  viewer: PlansViewer;
  defaultRegion: RegionId;
}) {
  const [region, setRegion] = useState<RegionId>(defaultRegion);
  const [showAll, setShowAll] = useState(false);
  const pricing = REGION_PRICING[region];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 pb-16">
      {/* Hero */}
      <header className="text-center">
        <span className="inline-flex rounded-full bg-mingle-lavender px-3 py-1 text-xs font-semibold uppercase tracking-wide text-mingle-purple">
          Plans &amp; pricing
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-mingle-text sm:text-5xl">
          Plans for every{" "}
          <span className="bg-gradient-to-r from-[#EA1E63] via-[#7B2FF7] to-[#3E6BE0] bg-clip-text text-transparent">
            hiring team
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-mingle-text-secondary">
          Start with a few jobs and unlock more as you grow. Your first {TRIAL_DAYS / 30} months are free — a card is
          needed to begin, and you are not charged until the trial ends.
        </p>
        <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-mingle-text-secondary">
          {[`${TRIAL_DAYS / 30} months free`, "Cancel anytime", "No charge during trial"].map((item) => (
            <li key={item} className="inline-flex items-center gap-1.5">
              <Check className="text-mingle-success" />
              {item}
            </li>
          ))}
        </ul>

        {viewer.grandfathered ? (
          <p className="mx-auto mt-6 max-w-xl rounded-2xl border border-mingle-border bg-mingle-surface px-4 py-3 text-sm text-mingle-text-secondary">
            Your account currently has full access at no charge. The plans below are shown for reference — we&apos;ll
            tell you in advance before anything changes.
          </p>
        ) : null}

        <div
          role="group"
          aria-label="Currency"
          className="mt-7 inline-flex rounded-full border border-mingle-border bg-mingle-white p-1"
        >
          {REGION_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={region === chip.id}
              onClick={() => setRegion(chip.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                region === chip.id
                  ? "bg-mingle-purple text-white"
                  : "text-mingle-text-secondary hover:text-mingle-text"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </header>

      {/* Plan cards */}
      <section aria-label="Plans" className="grid gap-5 pt-3 md:grid-cols-2 xl:grid-cols-3">
        {PURCHASABLE_PLANS.map((plan) => {
          const copy = PLAN_COPY[plan];
          return (
            <article
              key={plan}
              className={`relative flex flex-col gap-5 rounded-2xl border bg-mingle-white p-6 ${
                copy.popular
                  ? "border-2 border-mingle-purple shadow-[0_12px_40px_-12px_rgba(123,47,247,0.35)]"
                  : "border-mingle-border shadow-mingle"
              }`}
            >
              {copy.popular ? (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mingle-purple px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
              <div>
                <h2 className="font-display text-xl font-bold text-mingle-text">{copy.name}</h2>
                <p className="mt-1 min-h-[2.5rem] text-sm leading-snug text-mingle-text-secondary">{copy.tagline}</p>
              </div>
              <div>
                <p className="flex items-baseline gap-1.5 font-display">
                  <span className="text-4xl font-bold tracking-tight text-mingle-text">
                    {money(pricing.monthly[plan], pricing.symbol)}
                  </span>
                  <span className="text-sm text-mingle-text-secondary">/ month</span>
                </p>
                <p className="mt-1 text-xs text-mingle-text-secondary">excl. VAT · billed monthly</p>
              </div>
              <p className="rounded-full bg-mingle-lavender px-3 py-1.5 text-center text-xs font-semibold text-mingle-text">
                {copy.jobs}
              </p>
              <PlanCta plan={plan} viewer={viewer} />
              <div className="border-t border-mingle-border pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-mingle-text-secondary">
                  {copy.includes ? `Everything in ${copy.includes}, and:` : "Includes:"}
                </p>
                <ul className="flex flex-col gap-2.5 text-sm text-mingle-text">
                  {copy.highlights.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check className="mt-0.5 text-mingle-purple" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}

        {/* Enterprise */}
        <article className="relative flex flex-col gap-5 rounded-2xl border border-mingle-border bg-mingle-surface p-6 shadow-mingle md:col-span-2 xl:col-span-3">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-xl font-bold text-mingle-text">{ENTERPRISE_COPY.name}</h2>
              <p className="mt-1 text-sm text-mingle-text-secondary">
                {ENTERPRISE_COPY.tagline} {ENTERPRISE_COPY.jobs}, custom pricing.
              </p>
              <ul className="mt-4 grid gap-2.5 text-sm text-mingle-text sm:grid-cols-2">
                {ENTERPRISE_COPY.highlights.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <Check className="mt-0.5 text-mingle-purple" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 md:w-56">
              <p className="font-display text-2xl font-bold text-mingle-text">Custom price</p>
              <a
                href={ENTERPRISE_BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mingle-btn-secondary w-full text-center"
              >
                Talk to us
              </a>
            </div>
          </div>
        </article>
      </section>

      <p className="-mt-6 text-center text-xs text-mingle-text-secondary">
        Prices exclude VAT / sales tax, which is added at checkout. The price you pay follows your billing country.
      </p>

      {/* Complete features list */}
      <section aria-label="Compare plans">
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
            className="mingle-btn-secondary inline-flex items-center gap-2"
          >
            Complete features list
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className={`transition-transform ${showAll ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>

        {showAll ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-mingle-border bg-mingle-white shadow-mingle">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="bg-mingle-surface text-left">
                  <th scope="col" className="px-5 py-4 font-display text-base font-semibold text-mingle-text">
                    Features
                  </th>
                  {(["core", "plus", "max", "enterprise"] as PlanId[]).map((plan) => (
                    <th
                      key={plan}
                      scope="col"
                      className="px-4 py-4 text-center font-display text-base font-semibold capitalize text-mingle-text"
                    >
                      {plan}
                    </th>
                  ))}
                </tr>
              </thead>
              {COMPARE_GROUPS.map((group) => (
                <tbody key={group.title}>
                  <tr>
                    <th
                      colSpan={5}
                      scope="colgroup"
                      className="bg-mingle-lavender px-5 py-2 text-left text-xs font-bold uppercase tracking-wide text-mingle-purple"
                    >
                      {group.title}
                    </th>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label} className="border-t border-mingle-border">
                      <th scope="row" className="px-5 py-3 text-left font-medium text-mingle-text">
                        {row.label}
                      </th>
                      {(["core", "plus", "max", "enterprise"] as PlanId[]).map((plan) => {
                        const value = row.values[plan];
                        return (
                          <td key={plan} className="px-4 py-3 text-center text-mingle-text">
                            {value === true ? (
                              <Check className="mx-auto text-mingle-purple" />
                            ) : value === false ? (
                              <Dash />
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        ) : null}
      </section>

      {/* FAQ */}
      <section aria-label="Frequently asked questions" className="mx-auto w-full max-w-3xl">
        <h2 className="text-center font-display text-2xl font-bold text-mingle-text">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-mingle-border rounded-2xl border border-mingle-border bg-mingle-white shadow-mingle">
          {PLAN_FAQ.map((item) => (
            <details key={item.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-mingle-text">
                {item.q}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="shrink-0 text-mingle-text-secondary transition-transform group-open:rotate-180"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-mingle-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="rounded-3xl bg-mingle-lavender px-6 py-10 text-center">
        <h2 className="font-display text-2xl font-bold text-mingle-text">Not sure which plan fits?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-mingle-text-secondary">
          Book a short call and we&apos;ll help you pick the right plan for your hiring needs.
        </p>
        <a
          href={ENTERPRISE_BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mingle-btn-primary mt-5 inline-block"
        >
          Book a call
        </a>
      </section>
    </div>
  );
}
