"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { stashCareerApplyRoleId } from "@/lib/careers/client";

/**
 * Stash a role id from /onboarding/talent?role=... so it survives through
 * signup — attribution itself happens right after auth succeeds (see
 * reportCareerApplyAttribution in AuthForm's goAfterAuth).
 */
export function CareerApplyBeacon() {
  const params = useSearchParams();

  useEffect(() => {
    const roleId = params.get("role");
    if (!roleId) return;
    stashCareerApplyRoleId(roleId);
  }, [params]);

  return null;
}
