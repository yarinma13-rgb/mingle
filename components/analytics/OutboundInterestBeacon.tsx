"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const STORAGE_KEY = "mingle_outbound_interest_token";

/**
 * If the visitor arrived via /r/[token] → /welcome?..., the token is not in the
 * welcome URL (only UTMs). The redirect route already logged `click`.
 * This helper lets future pages mark visit/signup when a token is stashed.
 *
 * For now: if `interest_token` query exists, stash + ping visit.
 */
export function OutboundInterestBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("interest_token");
    if (token) {
      try {
        window.sessionStorage.setItem(STORAGE_KEY, token);
      } catch {
        // ignore
      }
      void fetch("/api/outbound/interest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventType: "visit" }),
      }).catch(() => {});
      return;
    }

    // After signup flows we can read stashed token later; no-op here.
  }, [params]);

  return null;
}

export function readStashedInterestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}
