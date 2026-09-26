const CAREER_APPLY_STORAGE_KEY = "mingle_career_apply_role_id";

export function readStashedCareerApplyRoleId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(CAREER_APPLY_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function stashCareerApplyRoleId(roleId: string): void {
  try {
    window.sessionStorage.setItem(CAREER_APPLY_STORAGE_KEY, roleId);
  } catch {
    // ignore
  }
}

/** Fire-and-forget — applying to a role must never break signup. */
export async function reportCareerApplyAttribution(): Promise<void> {
  const roleId = readStashedCareerApplyRoleId();
  if (!roleId) return;

  try {
    await fetch("/api/careers/apply", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roleId }),
    });
    window.sessionStorage.removeItem(CAREER_APPLY_STORAGE_KEY);
  } catch {
    // Attribution must never break auth.
  }
}
