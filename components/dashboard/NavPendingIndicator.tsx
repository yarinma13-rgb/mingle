"use client";

import { useLinkStatus } from "next/link";

/** Subtle pending pulse inside a Link while the next route streams. */
export function NavPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="absolute inset-0 animate-pulse rounded-xl bg-mingle-nav-active-bg/70"
    />
  );
}
