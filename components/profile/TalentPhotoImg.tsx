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
  const [src, setSrc] = useState<string | null>(() =>
    photo && isPublicPhotoUrl(photo) ? photo : null,
  );

  useEffect(() => {
    if (!photo) {
      setSrc(null);
      return;
    }
    if (isPublicPhotoUrl(photo)) {
      setSrc(photo);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    void resolveTalentPhotoUrl(supabase, photo).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [photo]);

  if (!src) return fallback;
  return <StorageImage src={src} className={className} sizes={sizes} />;
}
