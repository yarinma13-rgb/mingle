"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  reportInterestAttribution,
  stashInterestToken,
} from "@/lib/outbound-interest/client";

/**
 * Stash unique interest token from /welcome?interest_token=... and log visit.
 */
export function OutboundInterestBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("interest_token");
    if (!token) return;
    stashInterestToken(token);
    void reportInterestAttribution({ eventType: "visit" });
  }, [params]);

  return null;
}
