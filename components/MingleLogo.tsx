"use client";

import { useEffect, useState } from "react";
import logoSrc from "@/public/brand/mingle-mark-2026.jpg";

type MingleLogoProps = {
  /** "mark" and "lockup" both render the official M. No separate wordmark. */
  variant?: "mark" | "lockup";
  stacked?: boolean;
  size?: number;
  className?: string;
  /** Kept for call-site compatibility. Masked span is not a next/image. */
  priority?: boolean;
  alt?: string;
};

/**
 * Official mingle mark. Never recreate with SVG/text. Do not type "MINGLE"
 * as a replacement.
 *
 * TODO(brand-assets): `mingle-mark-2026.jpg` is a JPEG with a baked light
 * field and no alpha. The shape is a CSS `mask-image` painted with the
 * brand connection gradient until a transparent PNG/SVG ships.
 */
const DISPLAY_SCALE = 1.16;

let knockoutUrlPromise: Promise<string> | null = null;

function loadKnockoutMask(src: string): Promise<string> {
  if (!knockoutUrlPromise) {
    knockoutUrlPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = imageData.data;
        for (let i = 0; i < px.length; i += 4) {
          const r = px[i];
          const g = px[i + 1];
          const b = px[i + 2];
          const max = Math.max(r, g, b) / 255;
          const min = Math.min(r, g, b) / 255;
          const sat = max === 0 ? 0 : (max - min) / max;
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const isField = sat < 0.18 && lum > 0.72;
          const isMark = sat > 0.28 || lum < 0.62;
          let alpha = 0;
          if (isMark && !isField) alpha = 255;
          else if (!isField) alpha = Math.round(Math.min(1, sat / 0.28) * 255);
          px[i] = 255;
          px[i + 1] = 255;
          px[i + 2] = 255;
          px[i + 3] = alpha;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("logo"));
      img.src = src;
    });
  }
  return knockoutUrlPromise;
}

export function MingleLogo({
  variant = "lockup",
  size = 40,
  className = "",
  alt,
}: MingleLogoProps) {
  void variant;
  const displaySize = Math.round(size * DISPLAY_SCALE);
  const width = (displaySize * logoSrc.width) / logoSrc.height;
  const markAlt = alt === undefined ? "mingle" : alt;
  const decorative = markAlt === "";
  const [maskUrl, setMaskUrl] = useState(logoSrc.src);
  const [knockoutReady, setKnockoutReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadKnockoutMask(logoSrc.src)
      .then((url) => {
        if (cancelled) return;
        setMaskUrl(url);
        setKnockoutReady(true);
      })
      .catch(() => {
        /* JPEG luminance subtract remains as fallback. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : markAlt}
      aria-hidden={decorative ? true : undefined}
      data-knockout={knockoutReady ? "ready" : undefined}
      className={`mingle-logo-mark ${className}`.trim()}
      style={{
        width,
        height: displaySize,
        ["--mingle-logo-mask" as string]: `url("${maskUrl}")`,
      }}
    />
  );
}
