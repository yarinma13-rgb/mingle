"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signedTalentCvUrl, TALENT_CV_COPY } from "@/lib/profile/cv";

/**
 * Compact read-only CV opener for company-facing surfaces
 * (Discover browse, match cards, conversation context).
 */
export function OpenTalentCvButton({
  cvPath,
  cvFileName,
  className,
  label,
}: {
  cvPath: string | null | undefined;
  cvFileName?: string | null;
  className?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cvPath) return null;

  const handleOpen = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const url = await signedTalentCvUrl(supabase, cvPath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError(TALENT_CV_COPY.openFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={busy}
        className={
          className ??
          "mingle-btn-secondary max-w-full cursor-pointer truncate text-xs disabled:opacity-60"
        }
      >
        {busy ? "Opening…" : label ?? cvFileName ?? "Open CV"}
      </button>
      {error ? (
        <p className="text-[11px] text-mingle-text-secondary">{error}</p>
      ) : null}
    </div>
  );
}
