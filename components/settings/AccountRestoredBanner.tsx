"use client";

import { useState } from "react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

function readRestoredFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (window.sessionStorage.getItem("mingle.account.restored") === "1") {
      window.sessionStorage.removeItem("mingle.account.restored");
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Shows once after sign-in cancelled a pending 14-day account deletion. */
export function AccountRestoredBanner() {
  const { t } = useAppLocale();
  const [visible, setVisible] = useState(readRestoredFlag);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-2xl border border-mingle-success/30 bg-mingle-success/10 px-4 py-3 text-sm text-mingle-text"
    >
      <div className="flex items-start justify-between gap-3">
        <p>{t.settings.restored}</p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="shrink-0 text-xs font-semibold text-mingle-text-secondary underline"
        >
          OK
        </button>
      </div>
    </div>
  );
}
