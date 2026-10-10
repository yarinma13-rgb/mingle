"use client";

export const INTEREST_TOKEN_STORAGE_KEY = "mingle_outbound_interest_token";
export const INTEREST_AUDIENCE_STORAGE_KEY = "mingle_outbound_interest_audience";

export function readStashedInterestToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(INTEREST_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function stashInterestToken(token: string): void {
  try {
    window.sessionStorage.setItem(INTEREST_TOKEN_STORAGE_KEY, token);
  } catch {
    // ignore
  }
}

export async function reportInterestAttribution(input: {
  eventType: "visit" | "signup";
  userType?: "talent" | "company" | null;
  userId?: string | null;
}): Promise<void> {
  const token = readStashedInterestToken();
  if (!token) return;

  try {
    await fetch("/api/outbound/interest", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        eventType: input.eventType,
        userType: input.userType || undefined,
        userId: input.userId || undefined,
      }),
    });
    if (input.userType === "talent" || input.userType === "company") {
      try {
        window.sessionStorage.setItem(
          INTEREST_AUDIENCE_STORAGE_KEY,
          input.userType,
        );
      } catch {
        // ignore
      }
    }
  } catch {
    // Attribution must never break auth.
  }
}
