"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Circular founder portrait from the official photo asset.
 * Prefers /brand/founder.png (transparent circle), falls back to jpg,
 * then to a clean monogram if neither loads.
 */
export function FounderPhoto({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [src, setSrc] = useState("/brand/founder.png");
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`deck-founder-fallback ${className}`.trim()}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.3) }}
        aria-label="ירין כהן"
      >
        יכ
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt="ירין כהן"
      width={size}
      height={size}
      className={`deck-founder-photo ${className}`.trim()}
      style={{ width: size, height: size }}
      onError={() => {
        if (src.endsWith(".png")) {
          setSrc("/brand/founder.jpg");
          return;
        }
        setFailed(true);
      }}
      priority
    />
  );
}
