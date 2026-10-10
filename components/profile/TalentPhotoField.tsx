"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { Avatar } from "@/components/Avatar";
import {
  isPublicPhotoUrl,
  isTalentPhotoUnavailable,
  removeTalentPhoto,
  resolveTalentPhotoUrl,
  TALENT_PHOTO_COPY,
  TALENT_PHOTO_MAX_BYTES,
  uploadTalentPhoto,
} from "@/lib/profile/photo";
import type { Gender } from "@/lib/profile/avatar";

type TalentPhotoFieldProps = {
  supabase: SupabaseClient<Database>;
  userId: string;
  photo: string | null;
  onChanged: (photo: string | null) => void;
  initials?: string;
  gender?: Gender | null;
  variant?: "field" | "hero";
};

export function TalentPhotoField({
  supabase,
  userId,
  photo,
  onChanged,
  initials = "?",
  gender = null,
  variant = "field",
}: TalentPhotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [signedPreview, setSignedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!photo || isPublicPhotoUrl(photo)) {
      return;
    }
    let cancelled = false;
    void resolveTalentPhotoUrl(supabase, photo).then((url) => {
      if (!cancelled && url) setSignedPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photo, supabase]);

  const displayPhoto =
    localPreview ??
    (photo && isPublicPhotoUrl(photo) ? photo : null) ??
    (signedPreview && photo && !isPublicPhotoUrl(photo) ? signedPreview : null) ??
    photo;

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    try {
      const path = await uploadTalentPhoto(supabase, userId, file);
      onChanged(path);
      const signed = await resolveTalentPhotoUrl(supabase, path);
      if (signed) setSignedPreview(signed);
      setLocalPreview(null);
    } catch (error) {
      setLocalPreview(null);
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
      URL.revokeObjectURL(localUrl);
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
      setLocalPreview(null);
      setSignedPreview(null);
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

  const hasPhoto = Boolean(photo || localPreview || signedPreview);
  const avatar = (
    <Avatar
      photo={displayPhoto}
      initials={initials}
      gender={gender}
      size={variant === "hero" ? "hero" : "lg"}
    />
  );
  const picker = (
    <>
      <label className="mingle-btn-secondary cursor-pointer text-xs">
        {busy ? "Working…" : hasPhoto ? "Replace photo" : "Choose photo"}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          disabled={busy}
          onChange={(event) => void handlePick(event.target.files?.[0])}
        />
      </label>
      {hasPhoto && (
        <button
          type="button"
          onClick={() => void handleRemove()}
          disabled={busy}
          className="cursor-pointer rounded-full px-4 py-2 text-xs font-semibold text-mingle-text-secondary transition-colors hover:text-mingle-text disabled:opacity-60"
        >
          Remove
        </button>
      )}
    </>
  );

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-3">
        {avatar}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {picker}
        </div>
        <p className="text-xs text-mingle-text-secondary">
          JPEG, PNG, or WebP, up to{" "}
          {Math.round(TALENT_PHOTO_MAX_BYTES / (1024 * 1024))} MB. iPhone Live
          Photos / HEIC need to be saved as JPEG first.
        </p>
        {message && (
          <p className="text-xs text-mingle-pink">{message}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-mingle-text-secondary">
        Profile photo (optional)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {avatar}
        {picker}
      </div>
      <p className="mt-1.5 text-xs text-mingle-text-secondary">
        JPEG, PNG, or WebP, up to{" "}
        {Math.round(TALENT_PHOTO_MAX_BYTES / (1024 * 1024))} MB. iPhone Live
        Photos / HEIC need to be saved as JPEG first.
      </p>
      {message && (
        <p className="mt-1.5 text-xs text-mingle-pink">{message}</p>
      )}
    </div>
  );
}
