"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Remote storage images (Supabase public + signed URLs).
 * Uses unoptimized + native <img> fallback so a Next optimizer /
 * remotePatterns miss never looks like "upload failed".
 */
export function StorageImage({
  src,
  className,
  sizes,
  alt = "",
  priority = false,
  objectFit = "cover",
}: {
  src: string;
  className?: string;
  sizes: string;
  alt?: string;
  priority?: boolean;
  objectFit?: "cover" | "contain";
}) {
  const [broken, setBroken] = useState(false);
  const fitClass = objectFit === "contain" ? "object-contain" : "object-cover";
  const box = `relative overflow-hidden ${className ?? ""}`.trim();

  if (broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={`${box} ${fitClass}`} />
    );
  }

  return (
    <div className={box}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized
        className={fitClass}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
