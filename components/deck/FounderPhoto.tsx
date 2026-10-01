"use client";

import { useState } from "react";

/**
 * Circular founder portrait. Uses /brand/founder.jpg when present.
 * Falls back to a clean monogram ring until the photo is added.
 * Default to the monogram so a missing asset never flashes a broken image
 * before hydration can run onError.
 */
export function FounderPhoto({
  size = 96,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  return (
    <div
      className={`relative shrink-0 ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      {!ready ? (
        <div
          className="deck-founder-fallback"
          style={{
            width: size,
            height: size,
            fontSize: Math.round(size * 0.3),
          }}
          aria-hidden={ready}
        >
          יכ
        </div>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/founder.jpg"
        alt="ירין כהן"
        width={size}
        height={size}
        className="deck-founder-photo absolute inset-0"
        style={{
          width: size,
          height: size,
          opacity: ready ? 1 : 0,
          pointerEvents: ready ? "auto" : "none",
        }}
        onLoad={() => setReady(true)}
        onError={() => setReady(false)}
      />
    </div>
  );
}
