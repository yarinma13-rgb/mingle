import logoSrc from "@/public/brand/mingle-mark.jpg";

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
 * TODO(brand-assets): `mingle-mark.jpg` has a baked light field and no alpha.
 * Until a transparent PNG/SVG ships, the shape is a CSS `mask-image` painted
 * with the brand connection gradient (same approach as the old MINGLE-moment
 * knockout).
 */
const DISPLAY_SCALE = 1.16;

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

  return (
    <span
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : markAlt}
      aria-hidden={decorative ? true : undefined}
      className={`mingle-logo-mark ${className}`.trim()}
      style={{
        width,
        height: displaySize,
        ["--mingle-logo-mask" as string]: `url("${logoSrc.src}")`,
      }}
    />
  );
}
