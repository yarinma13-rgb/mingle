"use client";

import { reopenConsentPrompt } from "@/lib/analytics/consent";

export function CookieSettingsButton() {
  return (
    <button type="button" onClick={reopenConsentPrompt} className="underline">
      Cookie settings
    </button>
  );
}
