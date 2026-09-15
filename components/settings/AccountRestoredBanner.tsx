"use client";

import { useEffect, useState } from "react";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

/** Shows once after sign-in cancelled a pending 14-day account deletion. */
export function AccountRestoredBanner() {
  const { t } = useAppLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("mingle.account.restored") === "1") {
        window.sessionStorage.removeItem("mingle.account.restored");
        setVisible(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
