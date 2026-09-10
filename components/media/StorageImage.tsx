"use client";

import Image from "next/image";

export function StorageImage({
  src,
  className,
  sizes,
  alt = "",
  priority = false,
}: {
  src: string;
  className?: string;
  sizes: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`.trim()}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
