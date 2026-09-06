import Image from "next/image";
import logoSrc from "@/public/brand/mingle-mark.jpg";

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
 * Official mingle mark from public/brand/mingle-mark.jpg.
 * Never recreate with SVG/text. Do not type "mingle" as a replacement.
 */
export function MingleLogo({
  variant = "lockup",
  size = 40,
  className = "",
  priority = false,
  alt,
}: MingleLogoProps) {
  const width = (size * logoSrc.width) / logoSrc.height;
  const markAlt = alt === undefined ? "mingle" : alt;
  const pixelSize = Math.ceil(size);

  return (
    <Image
      src={logoSrc}
      alt={markAlt}
      height={size}
      width={width}
      priority={priority}
      quality={70}
      sizes={`${pixelSize}px`}
      className={`inline-block h-auto max-w-full object-contain ${className}`}
      style={{ height: size, width }}
    />
  );
}
