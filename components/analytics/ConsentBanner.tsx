"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { resolveConsent, setConsent, subscribeConsent } from "@/lib/analytics/consent";

/** Shown only to visitors who must opt in (EU/EEA, UK, CH); everyone else never sees it. */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveConsent().then((state) => {
      if (!cancelled) setVisible(state === "pending");
    });
    const unsubscribe = subscribeConsent((state) => setVisible(state === "pending"));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-mingle-border bg-mingle-white p-4 shadow-mingle sm:flex-row sm:items-center sm:gap-4"
    >
      <p className="flex-1 text-sm leading-relaxed text-mingle-text-secondary">
        We use analytics and advertising-measurement cookies to understand how
        mingle is used and which ads work. They stay off unless you accept. See
        our{" "}
        <Link href="/legal/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => setConsent("denied")}
          className="rounded-full border border-mingle-border px-4 py-2 text-sm font-semibold text-mingle-text"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => setConsent("granted")}
          className="rounded-full bg-mingle-cta px-4 py-2 text-sm font-semibold text-white"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
