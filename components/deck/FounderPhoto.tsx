"use client";

import { useState } from "react";

/**
 * Circular founder portrait. Uses /brand/founder.jpg when present.
 * Falls back to a clean monogram ring until the photo is added.
 */
export function FounderPhoto({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
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
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/founder.jpg"
      alt="ירין כהן"
      width={size}
      height={size}
      className={`deck-founder-photo ${className}`.trim()}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}
