import Image from "next/image";
import markSrc from "@/public/brand/mingle-mark.jpg";
import wordSrc from "@/public/brand/mingle-word.png";

type MingleLogoProps = {
  /** "mark" — just the M icon. "lockup" — mark + wordmark side by side. */
  variant?: "mark" | "lockup";
  /** Stack the mark above the wordmark instead of side by side. Only applies to "lockup". */
  stacked?: boolean;
  /** Height in pixels of the mark. */
  size?: number;
  className?: string;
  priority?: boolean;
  /** Override image alt. Pass empty string when the mark is decorative. */
  alt?: string;
};

/**
 * The official MINGLE logo. Single source of truth per PRODUCT_SPEC.md section 9 —
 * never recreate with text, never type "MINGLE" as a replacement.
 */
export function MingleLogo({
  variant = "lockup",
  stacked = false,
  size = 40,
  className = "",
  priority = false,
  alt,
}: MingleLogoProps) {
  return (
    <div
      className={`inline-flex items-center ${
        stacked ? "flex-col gap-3" : "gap-2.5"
      } ${className}`}
    >
      <Image
        src={markSrc}
        alt={alt ?? (variant === "mark" ? "mingle" : "")}
        height={size}
        width={(size * markSrc.width) / markSrc.height}
        priority={priority}
        className="rounded-[22%] object-contain"
      />
      {variant === "lockup" && (
        <Image
          src={wordSrc}
          alt="mingle"
          height={size * 0.6}
          width={(size * 0.6 * wordSrc.width) / wordSrc.height}
          priority={priority}
          className="object-contain"
        />
      )}
    </div>
  );
}
