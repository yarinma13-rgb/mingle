import Image from "next/image";
import logoSrc from "@/public/brand/mingle-mark.png";

type MingleLogoProps = {
  /** "mark" and "lockup" both render the official M. No separate wordmark. */
  variant?: "mark" | "lockup";
  stacked?: boolean;
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
};

/**
 * Official mingle mark. Never recreate with SVG/text. Do not type "MINGLE"
 * as a replacement.
 *
 * `mingle-mark.png` keeps the file's own pink / purple / blue pixels and only
 * knocks out the JPEG's baked white field. Do not paint it with a CSS gradient.
 */
export function MingleLogo({
  variant = "lockup",
  size = 40,
  className = "",
  priority = false,
  alt,
}: MingleLogoProps) {
  void variant;
  const height = size;
  const width = Math.round((height * logoSrc.width) / logoSrc.height);
  const markAlt = alt === undefined ? "mingle" : alt;

  return (
    <Image
      src={logoSrc}
      alt={markAlt}
      width={width}
      height={height}
      priority={priority}
      className={`mingle-logo-mark ${className}`.trim()}
    />
  );
}
