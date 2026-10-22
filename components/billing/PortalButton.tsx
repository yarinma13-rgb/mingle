"use client";

import { useState } from "react";

/** Opens the Stripe customer portal (update card, change plan, cancel). */
export function PortalButton({ label = "Manage billing" }: { label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Couldn't open billing. Please try again.");
        setBusy(false);
        return;
      }
      window.location.assign(json.url);
    } catch {
      setError("Couldn't open billing. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button type="button" onClick={() => void open()} disabled={busy} className="mingle-btn-primary text-sm disabled:opacity-60">
        {busy ? "Opening…" : label}
      </button>
      {error ? (
        <p role="alert" className="text-xs text-mingle-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
