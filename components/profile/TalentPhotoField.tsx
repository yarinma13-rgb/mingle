"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { TalentPhotoImg } from "@/components/profile/TalentPhotoImg";
import {
  isTalentPhotoUnavailable,
  removeTalentPhoto,
  TALENT_PHOTO_COPY,
  TALENT_PHOTO_MAX_BYTES,
  uploadTalentPhoto,
} from "@/lib/profile/photo";

type TalentPhotoFieldProps = {
  supabase: SupabaseClient<Database>;
  userId: string;
  photo: string | null;
  onChanged: (photo: string | null) => void;
};

export function TalentPhotoField({
  supabase,
  userId,
  photo,
  onChanged,
}: TalentPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const path = await uploadTalentPhoto(supabase, userId, file);
      onChanged(path);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === TALENT_PHOTO_COPY.invalidFile
      ) {
        setMessage(TALENT_PHOTO_COPY.invalidFile);
      } else if (isTalentPhotoUnavailable(error)) {
        setMessage(TALENT_PHOTO_COPY.notReady);
      } else {
        setMessage(TALENT_PHOTO_COPY.uploadFailed);
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
      await removeTalentPhoto(supabase, userId, photo);
      onChanged(null);
    } catch (error) {
      if (isTalentPhotoUnavailable(error)) {
        setMessage(TALENT_PHOTO_COPY.notReady);
      } else {
        setMessage(TALENT_PHOTO_COPY.removeFailed);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
        Profile photo (optional)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <TalentPhotoImg
          photo={photo}
          className="h-12 w-12 rounded-full object-cover"
          fallback={
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mingle-lavender text-xs font-semibold text-mingle-text-secondary">
              Photo
            </div>
          }
        />
        <label className="mingle-btn-secondary cursor-pointer text-xs">
          {busy ? "Working…" : photo ? "Replace photo" : "Choose photo"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="hidden"
            disabled={busy}
            onChange={(event) => handlePick(event.target.files?.[0])}
          />
        </label>
        {photo && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="cursor-pointer rounded-full px-4 py-2 text-xs font-semibold text-mingle-text-secondary transition-colors hover:text-mingle-text disabled:opacity-60"
          >
            Remove
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-mingle-text-secondary">
        JPEG, PNG, or WebP, up to{" "}
        {Math.round(TALENT_PHOTO_MAX_BYTES / (1024 * 1024))} MB.
      </p>
      {message && (
        <p className="mt-1.5 text-xs text-mingle-text-secondary">{message}</p>
      )}
    </div>
  );
}
