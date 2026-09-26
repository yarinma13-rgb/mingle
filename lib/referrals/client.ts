"use client";

export const REFERRAL_ID_STORAGE_KEY = "mingle_referral_id";

export function readStashedReferralId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(REFERRAL_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function stashReferralId(id: string): void {
  try {
    window.sessionStorage.setItem(REFERRAL_ID_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

/** Fire-and-forget — attribution must never break signup. */
export async function reportReferralAttribution(): Promise<void> {
  const referralId = readStashedReferralId();
  if (!referralId) return;

  try {
    await fetch("/api/referrals/claim", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralId }),
    });
    window.sessionStorage.removeItem(REFERRAL_ID_STORAGE_KEY);
  } catch {
    // Attribution must never break auth.
  }
}
