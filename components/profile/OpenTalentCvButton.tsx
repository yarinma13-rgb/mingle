"use client";

import { useState } from "react";
import Link from "next/link";
import { TALENT_CV_COPY } from "@/lib/profile/cv";
import { signedTalentCvUrlAction } from "@/lib/profile/cv-action";

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
      const result = await signedTalentCvUrlAction(cvPath);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch {
      setError(TALENT_CV_COPY.openFailed);
    } finally {
      setBusy(false);
    }
  };

  const text = busy
    ? "Opening…"
    : label ?? (cvFileName?.trim() ? cvFileName.trim() : "Open CV");

  return (
    <span className="inline-flex max-w-full flex-col items-stretch gap-1">
      <button
        type="button"
        onClick={() => void handleOpen()}
        disabled={busy}
        title={cvFileName?.trim() || "Open CV"}
        className={
          className ??
          "inline-flex max-w-full items-center justify-center truncate rounded-full border border-mingle-border bg-mingle-lavender px-4 py-2 font-display text-xs font-semibold text-mingle-text transition-colors hover:border-mingle-blue disabled:opacity-60"
        }
      >
        {text}
      </button>
      {error ? (
        <p className="text-[11px] text-mingle-text-secondary">{error}</p>
      ) : null}
    </span>
  );
}

/** Shared CTA pair: View profile + Open CV (or No CV) under a candidate photo. */
export function CandidateProfileCvActions({
  userId,
  cvPath,
  cvFileName,
  onViewProfile,
  variant = "light",
}: {
  userId: string;
  cvPath?: string | null;
  cvFileName?: string | null;
  onViewProfile?: () => void;
  variant?: "light" | "onDark";
}) {
  const light = variant === "light";
  const viewClass = light
    ? "mingle-btn-primary px-4 py-2 text-xs shadow-none"
    : "rounded-[12px] bg-mingle-cta px-4 py-2 font-display text-xs font-semibold text-white shadow-sm";
  const cvClass = light
    ? "mingle-btn-secondary inline-flex max-w-[11rem] items-center justify-center truncate px-4 py-2 text-xs disabled:opacity-60"
    : "inline-flex max-w-[11rem] items-center justify-center truncate rounded-[12px] border border-white/55 bg-white/15 px-4 py-2 font-display text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25 disabled:opacity-60";
  const missingClass = light
    ? "rounded-[12px] border border-dashed border-mingle-border px-4 py-2 font-display text-xs font-semibold text-mingle-text-secondary"
    : "rounded-[12px] border border-dashed border-white/40 px-4 py-2 font-display text-xs font-semibold text-white/75";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/profile/view/${userId}`}
        onClick={onViewProfile}
        className={viewClass}
      >
        View profile
      </Link>
      {cvPath ? (
        <OpenTalentCvButton
          cvPath={cvPath}
          cvFileName={cvFileName}
          label={cvFileName?.trim() ? cvFileName.trim() : "Open CV"}
          className={cvClass}
        />
      ) : (
        <span className={missingClass}>No CV</span>
      )}
    </div>
  );
}
