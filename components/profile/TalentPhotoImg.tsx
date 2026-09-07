"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  isPublicPhotoUrl,
  resolveTalentPhotoUrl,
} from "@/lib/profile/photo";

export function TalentPhotoImg({
  photo,
  className,
  fallback,
}: {
  photo: string | null;
  className?: string;
  fallback: React.ReactNode;
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
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={className} />
  );
}
