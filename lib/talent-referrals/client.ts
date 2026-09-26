"use client";

export const TALENT_REF_STORAGE_KEY = "mingle_talent_ref_code";
export const TALENT_REF_COOKIE = "mingle_talent_ref";
export const TALENT_REF_VISITOR_KEY = "mingle_talent_ref_visitor";
const COOKIE_MAX_AGE_DAYS = 30;

function isValidTalentRefCode(code: string): boolean {
  return /^[a-z0-9]{6,12}$/.test(code);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1)) || null;
}

function writeCookie(name: string, value: string, maxAgeDays: number): void {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function readStashedTalentRefCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = window.sessionStorage.getItem(TALENT_REF_STORAGE_KEY);
    if (fromSession && isValidTalentRefCode(fromSession)) return fromSession;
  } catch {
    // ignore
  }
  const fromCookie = readCookie(TALENT_REF_COOKIE);
  if (fromCookie && isValidTalentRefCode(fromCookie)) return fromCookie;
  return null;
}

/** Persist referral across delayed signup (session + 30-day cookie). */
export function stashTalentRefCode(code: string): void {
  const normalized = code.trim().toLowerCase();
  if (!isValidTalentRefCode(normalized)) return;
  try {
    window.sessionStorage.setItem(TALENT_REF_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
  writeCookie(TALENT_REF_COOKIE, normalized, COOKIE_MAX_AGE_DAYS);
}

export function clearStashedTalentRefCode(): void {
  try {
    window.sessionStorage.removeItem(TALENT_REF_STORAGE_KEY);
  } catch {
    // ignore
  }
  clearCookie(TALENT_REF_COOKIE);
}

/** Stable anonymous visitor id for unique open / signup-started counts. */
export function getOrCreateTalentRefVisitorKey(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(TALENT_REF_VISITOR_KEY);
    if (existing && existing.length >= 8) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(TALENT_REF_VISITOR_KEY, next);
    return next;
  } catch {
    return `v_${Date.now().toString(36)}`;
  }
}

/** Fire-and-forget — attribution must never break signup. */
export async function reportTalentReferralAttribution(): Promise<void> {
  const code = readStashedTalentRefCode();
  if (!code) return;

  try {
    await fetch("/api/talent-referrals/claim", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    clearStashedTalentRefCode();
  } catch {
    // Attribution must never break auth.
  }
}

export async function reportTalentReferralOpen(code: string): Promise<boolean> {
  const normalized = code.trim().toLowerCase();
  if (!isValidTalentRefCode(normalized)) return false;
  const visitorKey = getOrCreateTalentRefVisitorKey();
  try {
    const res = await fetch("/api/talent-referrals/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: normalized, visitorKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportTalentReferralSignupStarted(): Promise<void> {
  const code = readStashedTalentRefCode();
  if (!code) return;
  const visitorKey = getOrCreateTalentRefVisitorKey();
  try {
    await fetch("/api/talent-referrals/signup-started", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, visitorKey }),
    });
  } catch {
    // never block auth UX
  }
}

export function talentInviteShareUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/join?ref=${encodeURIComponent(code)}`;
}
