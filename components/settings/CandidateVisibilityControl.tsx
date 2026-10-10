"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  setCandidateVisibility,
  type CandidateVisibilityStatus,
} from "@/lib/talent-exchange/persistence";
import { useToast } from "@/components/toast/ToastProvider";
import { useAppLocale } from "@/components/i18n/AppLocaleProvider";

const MODES: {
  value: CandidateVisibilityStatus;
  icon: string;
  titleKey: "visibilityModePrivate" | "visibilityModeDiscoverable" | "visibilityModeOpen";
  bodyKey:
    | "visibilityModePrivateBody"
    | "visibilityModeDiscoverableBody"
    | "visibilityModeOpenBody";
}[] = [
  {
    value: "private",
    icon: "🔒",
    titleKey: "visibilityModePrivate",
    bodyKey: "visibilityModePrivateBody",
  },
  {
    value: "discoverable",
    icon: "🕶️",
    titleKey: "visibilityModeDiscoverable",
    bodyKey: "visibilityModeDiscoverableBody",
  },
  {
    value: "open_to_opportunities",
    icon: "👤",
    titleKey: "visibilityModeOpen",
    bodyKey: "visibilityModeOpenBody",
  },
];

export function CandidateVisibilityControl({
  candidateId,
  initialStatus,
}: {
  candidateId: string;
  initialStatus: CandidateVisibilityStatus;
}) {
  const { t } = useAppLocale();
  const toast = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function choose(next: CandidateVisibilityStatus) {
    if (next === status || busy) return;
    setBusy(true);
    const previous = status;
    setStatus(next);
    try {
      const supabase = createClient();
      await setCandidateVisibility(supabase, candidateId, next, "privacy_settings");
      toast(t.settings.visibilitySaved);
    } catch {
      setStatus(previous);
      toast("Couldn't save that. Try again in a moment.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {MODES.map((mode) => {
        const selected = status === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            disabled={busy}
            onClick={() => void choose(mode.value)}
            className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-start transition-colors disabled:opacity-60 ${
              selected
                ? "border-mingle-purple bg-mingle-lavender"
                : "border-mingle-border bg-mingle-white hover:border-mingle-purple/40"
            }`}
          >
            <span aria-hidden className="text-lg leading-none">
              {mode.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-mingle-text">
                {t.settings[mode.titleKey]}
              </span>
              <span className="mt-0.5 block text-sm text-mingle-text-secondary">
                {t.settings[mode.bodyKey]}
              </span>
            </span>
          </button>
        );
      })}
      <p className="px-1 text-xs text-mingle-text-secondary">
        {t.settings.visibilityChangeAnytime}
      </p>
    </div>
  );
}
