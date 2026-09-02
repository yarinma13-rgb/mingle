"use client";

import { useSyncExternalStore } from "react";

// Same 768px threshold and useSyncExternalStore pattern as HomeShell's
// splash variant detection, kept consistent across the app: server has
// no viewport, so it always renders the desktop assumption until the
// client hydrates and measures.
const MOBILE_BREAKPOINT = 768;

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
