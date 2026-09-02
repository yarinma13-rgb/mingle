"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  isTalentCvUnavailable,
  removeTalentCv,
  signedTalentCvUrl,
  TALENT_CV_COPY,
  TALENT_CV_MAX_BYTES,
  uploadTalentCv,
} from "@/lib/profile/cv";

type TalentCvFieldProps = {
  supabase: SupabaseClient<Database>;
  userId: string;
  cvPath: string | null;
  cvFileName: string | null;
  editable: boolean;
  showLabel?: boolean;
  onChanged: (next: { cvPath: string | null; cvFileName: string | null }) => void;
};

export function TalentCvField({
  supabase,
  userId,
  cvPath,
  cvFileName,
  editable,
  showLabel = true,
  onChanged,
}: TalentCvFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasFile = Boolean(cvPath && cvFileName);

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const saved = await uploadTalentCv(supabase, userId, file);
      onChanged({ cvPath: saved.path, cvFileName: saved.fileName });
    } catch (error) {
      if (error instanceof Error && error.message === TALENT_CV_COPY.invalidFile) {
        setMessage(TALENT_CV_COPY.invalidFile);
      } else if (isTalentCvUnavailable(error)) {
        setMessage(TALENT_CV_COPY.notReady);
      } else {
        setMessage(TALENT_CV_COPY.uploadFailed);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await removeTalentCv(supabase, userId, cvPath);
      onChanged({ cvPath: null, cvFileName: null });
    } catch (error) {
      if (isTalentCvUnavailable(error)) {
        setMessage(TALENT_CV_COPY.notReady);
      } else {
        setMessage(TALENT_CV_COPY.removeFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleOpen = async () => {
    if (!cvPath) return;
    setBusy(true);
    setMessage(null);
    try {
      const url = await signedTalentCvUrl(supabase, cvPath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setMessage(TALENT_CV_COPY.openFailed);
    } finally {
      setBusy(false);
    }
  };

  if (!editable && !hasFile) return null;

  return (
    <div>
      {editable && showLabel && (
        <p className="mb-1.5 text-xs font-medium text-mingle-text-secondary">
          CV (optional)
        </p>
      )}
      {!editable && showLabel && hasFile && (
        <p className="mb-1.5 font-display text-sm font-semibold text-mingle-white">
          CV
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {hasFile && (
          <button
            type="button"
            onClick={handleOpen}
            disabled={busy}
            className="max-w-full cursor-pointer truncate rounded-full bg-mingle-surface px-4 py-2 text-xs font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70 disabled:opacity-60"
          >
            {cvFileName}
          </button>
        )}
        {editable && (
          <label className="cursor-pointer rounded-full bg-mingle-surface px-4 py-2 text-xs font-semibold text-mingle-white transition-colors hover:bg-mingle-surface/70">
            {busy ? "Working…" : hasFile ? "Replace PDF" : "Choose PDF"}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={busy}
              onChange={(event) => handlePick(event.target.files?.[0])}
            />
          </label>
        )}
        {editable && hasFile && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="cursor-pointer rounded-full px-4 py-2 text-xs font-semibold text-mingle-text-secondary transition-colors hover:text-mingle-white disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
      {editable && !hasFile && (
        <p className="mt-1.5 text-xs text-mingle-text-secondary">
          PDF only, up to {Math.round(TALENT_CV_MAX_BYTES / (1024 * 1024))} MB. A
          CV here is extra context, not the heart of your profile.
        </p>
      )}
      {message && (
        <p className="mt-1.5 text-xs text-mingle-text-secondary">{message}</p>
      )}
    </div>
  );
}
