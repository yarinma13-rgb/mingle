"use client";

import { useState } from "react";
import { enableWebPush } from "@/lib/push/client";

export function PushOptIn() {
  const [status, setStatus] = useState<"idle" | "on" | "blocked" | "error">("idle");
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true);
    try {
      const ok = await enableWebPush();
      setStatus(ok ? "on" : Notification.permission === "denied" ? "blocked" : "error");
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-mingle-text">Browser notifications</p>
        <p className="text-sm text-mingle-text-secondary">
          Get a ping for new matches and messages, even if mingle is in another tab.
        </p>
        {status === "on" ? (
          <p className="mt-1 text-xs text-mingle-success">Notifications are on for this browser.</p>
        ) : null}
        {status === "blocked" ? (
          <p className="mt-1 text-xs text-mingle-text-secondary">
            Notifications are blocked in the browser. Allow them in site settings, then try again.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-1 text-xs text-mingle-warning">
            Could not enable notifications. Run the push SQL migration and add VAPID keys.
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void enable()}
        className="mingle-btn-secondary shrink-0 text-xs"
      >
        {busy ? "Enabling…" : "Enable"}
      </button>
    </div>
  );
}
