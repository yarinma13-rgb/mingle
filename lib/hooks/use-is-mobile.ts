"use client";

import { useSyncExternalStore } from "react";

// Match Tailwind `md` (768px) plus real touch phones in landscape, where
// innerWidth can exceed 768 but the pointer is still coarse. Server has
// no viewport, so it assumes desktop until hydrate — same pattern as
// HomeShell splash detection.
const NARROW = "(max-width: 767.98px)";
const TOUCH = "(hover: none) and (pointer: coarse)";

function isSwipeViewport() {
  return (
    window.matchMedia(NARROW).matches || window.matchMedia(TOUCH).matches
  );
}

function subscribe(callback: () => void) {
  const narrow = window.matchMedia(NARROW);
  const touch = window.matchMedia(TOUCH);
  window.addEventListener("resize", callback);
  narrow.addEventListener("change", callback);
  touch.addEventListener("change", callback);
  return () => {
    window.removeEventListener("resize", callback);
    narrow.removeEventListener("change", callback);
    touch.removeEventListener("change", callback);
  };
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, isSwipeViewport, getServerSnapshot);
}
