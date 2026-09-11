"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StorageImage } from "@/components/media/StorageImage";
import {
  isPublicPhotoUrl,
  resolveTalentPhotoUrl,
} from "@/lib/profile/photo";

export function TalentPhotoImg({
  photo,
  className,
  fallback,
  sizes = "80px",
}: {
  photo: string | null;
  className?: string;
  fallback: React.ReactNode;
  sizes?: string;
}) {
  const publicSrc = photo && isPublicPhotoUrl(photo) ? photo : null;
  const [signed, setSigned] = useState<{ photo: string; url: string } | null>(
    null,
  );

  useEffect(() => {
    if (!photo || isPublicPhotoUrl(photo)) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void resolveTalentPhotoUrl(supabase, photo).then((url) => {
      if (!cancelled && url) {
        setSigned({ photo, url });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  const src =
    publicSrc ?? (signed && signed.photo === photo ? signed.url : null);

  if (!src) return fallback;
  return <StorageImage src={src} className={className} sizes={sizes} />;
}
