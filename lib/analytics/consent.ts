import { posthogKey } from "@/lib/monitoring/env";

export type ConsentState = "granted" | "denied" | "pending";

const STORAGE_KEY = "mingle_analytics_consent";
const NOT_REQUIRED_KEY = "mingle_consent_not_required_at";
const NOT_REQUIRED_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CHANGE_EVENT = "mingle:consent-change";

let current: ConsentState | null = null;
let decision: Promise<ConsentState> | null = null;

function readStored(): "granted" | "denied" | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function notRequiredRecently(): boolean {
  try {
    const at = Number(window.localStorage.getItem(NOT_REQUIRED_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < NOT_REQUIRED_TTL_MS;
  } catch {
    return false;
  }
}

async function decide(): Promise<ConsentState> {
  if (typeof window === "undefined" || !posthogKey()) return "denied";

  const stored = readStored();
  if (stored) return stored;
  if (notRequiredRecently()) return "granted";

  try {
    const res = await fetch("/api/geo", { cache: "no-store" });
    if (res.ok) {
      const body = (await res.json()) as { requiresConsent?: boolean };
      if (body.requiresConsent === false) {
        try {
          window.localStorage.setItem(NOT_REQUIRED_KEY, String(Date.now()));
        } catch {
          // Storage blocked: we just ask the geo route again next time.
        }
        return "granted";
      }
    }
  } catch {
    // Network failure: fall through to the conservative answer.
  }
  return "pending";
}

/** Resolves once per page load; later changes arrive through subscribeConsent. */
export function resolveConsent(): Promise<ConsentState> {
  decision ??= decide().then((state) => {
    current ??= state;
    return current;
  });
  return decision;
}

export function getConsentState(): ConsentState | null {
  return current;
}

function emit(state: ConsentState) {
  current = state;
  window.dispatchEvent(new CustomEvent<ConsentState>(CHANGE_EVENT, { detail: state }));
}

export function setConsent(value: "granted" | "denied"): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Choice still applies for this page view.
  }
  emit(value);
}

/** Lets a visitor change their mind: clears the stored choice and re-asks. */
export function reopenConsentPrompt(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(NOT_REQUIRED_KEY);
  } catch {
    // Ignore.
  }
  emit("pending");
}

export function subscribeConsent(callback: (state: ConsentState) => void): () => void {
  const handler = (event: Event) => callback((event as CustomEvent<ConsentState>).detail);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}
