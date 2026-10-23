"use client";

import { useMemo, useState } from "react";
import { PURCHASABLE_PLANS, type PurchasablePlanId } from "@/lib/billing/plans";
import { priceFor, regionForCountry, TRIAL_DAYS } from "@/lib/billing/pricing";

/** Enterprise is sales-led: "Talk to us" books a call on the founder's calendar. */
const ENTERPRISE_BOOKING_URL = "https://calendly.com/yarinma13/30min";

const COUNTRY_CODES = [
  "IL", "US", "GB", "CA", "AU", "NZ", "IE", "DE", "FR", "ES", "IT", "NL", "BE", "AT", "PT",
  "FI", "GR", "LU", "MT", "CY", "EE", "LV", "LT", "SK", "SI", "HR", "BG", "SE", "DK", "NO",
  "CH", "PL", "CZ", "HU", "RO", "UA", "TR", "AE", "SA", "IN", "SG", "JP", "KR", "HK", "CN",
  "BR", "MX", "AR", "CL", "CO", "ZA", "EG", "NG", "KE",
];

const PLAN_COPY: Record<
  PurchasablePlanId,
  { name: string; tagline: string; jobs: string; features: string[]; popular?: boolean }
> = {
  core: {
    name: "Core",
    tagline: "For lean hiring teams getting started.",
    jobs: "1–3 active jobs",
    features: [
      "AI matching (Role, Human, Motivation fit)",
      "Why match / Why not insights",
      "Candidate pipeline & basic ATS",
      "Calendar integration",
      "Team collaboration (up to 3 users)",
      "Standard support",
      "Basic reporting",
    ],
  },
  plus: {
    name: "Plus",
    tagline: "For growing teams with more hiring needs.",
    jobs: "4–10 active jobs",
    features: [
      "All Core features",
      "Candidate comparison",
      "Talent pool (save & reuse candidates)",
      "Recruitment analytics",
      "Advanced reporting",
      "Expanded hiring team (up to 10 users)",
      "Priority support",
    ],
  },
  max: {
    name: "Max",
    tagline: "For high-volume teams that need advanced intelligence.",
    jobs: "11–25 active jobs",
    features: [
      "All Plus features",
      "Interview intelligence",
      "Talent rediscovery (Talent Exchange)",
      "Company insights",
      "Advanced analytics & dashboards",
      "Expanded hiring team (up to 25 users)",
      "Dedicated success manager",
    ],
    popular: true,
  },
};

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function money(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

export function PlanPicker({ defaultCountry }: { defaultCountry: string }) {
  const [country, setCountry] = useState(
    COUNTRY_CODES.includes(defaultCountry) ? defaultCountry : "IL",
  );
  const [busy, setBusy] = useState<PurchasablePlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countries = useMemo(
    () =>
      COUNTRY_CODES.map((code) => ({ code, name: countryName(code) })).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    [],
  );
  const region = regionForCountry(country);

  async function start(plan: PurchasablePlanId) {
    if (busy) return;
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, country }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Couldn't start checkout. Please try again.");
        setBusy(null);
        return;
      }
      window.location.assign(json.url);
    } catch {
      setError("Couldn't start checkout. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-mingle-text">
          Flexible plans for every hiring stage
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-mingle-text-secondary">
          Start with a few jobs and unlock more as you grow. Your first {TRIAL_DAYS / 30} months are free — add a card
          now and you won&apos;t be charged until the trial ends. Cancel anytime before then at no cost.
        </p>
        <label className="mt-5 inline-flex items-center gap-2 text-sm text-mingle-text-secondary">
          <span className="font-medium text-mingle-text">Company country</span>
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="rounded-full border border-mingle-border bg-mingle-white px-3 py-1.5 text-sm text-mingle-text"
          >
            {countries.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-mingle-text-secondary">
          Prices are per month and exclude VAT / sales tax, which is added at checkout. Your billing address must match
          this country.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mx-auto max-w-xl rounded-xl border border-mingle-error/30 bg-mingle-error/10 px-4 py-3 text-sm text-mingle-error">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PURCHASABLE_PLANS.map((plan) => {
          const copy = PLAN_COPY[plan];
          const price = priceFor(country, plan);
          return (
            <article
              key={plan}
              className={`relative flex flex-col gap-4 rounded-2xl border bg-mingle-white p-6 shadow-mingle ${
                copy.popular ? "border-mingle-purple" : "border-mingle-border"
              }`}
            >
              {copy.popular ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-mingle-purple px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
              <div>
                <h2 className="font-display text-xl font-semibold text-mingle-text">{copy.name}</h2>
                <p className="mt-1 text-sm text-mingle-text-secondary">{copy.tagline}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-mingle-text">
                {price ? money(price.amount, price.symbol) : "—"}
                <span className="text-sm font-normal text-mingle-text-secondary"> / month</span>
              </p>
              <p className="rounded-full bg-mingle-lavender px-3 py-1.5 text-center text-xs font-semibold text-mingle-text">
                {copy.jobs}
              </p>
              <ul className="flex flex-1 flex-col gap-2 text-sm text-mingle-text">
                {copy.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span aria-hidden className="text-mingle-success">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={busy !== null || !region}
                onClick={() => void start(plan)}
                className="mingle-btn-primary w-full disabled:opacity-60"
              >
                {busy === plan ? "Opening checkout…" : `Start ${TRIAL_DAYS / 30}-month free trial`}
              </button>
            </article>
          );
        })}

        <article className="flex flex-col gap-4 rounded-2xl border border-mingle-border bg-mingle-white p-6 shadow-mingle">
          <div>
            <h2 className="font-display text-xl font-semibold text-mingle-text">Enterprise</h2>
            <p className="mt-1 text-sm text-mingle-text-secondary">Tailored to your organization&apos;s unique needs.</p>
          </div>
          <p className="font-display text-2xl font-semibold text-mingle-text">Custom pricing</p>
          <p className="rounded-full bg-mingle-lavender px-3 py-1.5 text-center text-xs font-semibold text-mingle-text">
            25+ active jobs
          </p>
          <ul className="flex flex-1 flex-col gap-2 text-sm text-mingle-text">
            {[
              "All Max features",
              "Custom configuration",
              "Unlimited users",
              "SSO & advanced security",
              "Dedicated customer success & support",
            ].map((feature) => (
              <li key={feature} className="flex gap-2">
                <span aria-hidden className="text-mingle-success">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
          <a
            href={ENTERPRISE_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mingle-btn-secondary w-full text-center"
          >
            Talk to us
          </a>
        </article>
      </div>
    </div>
  );
}
