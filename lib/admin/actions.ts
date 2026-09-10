"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/access";
import { recordReviewAction } from "@/lib/admin/reviews";

const ACTIONS = new Set(["approved", "rejected", "flagged", "note"] as const);

export async function reviewMatchAction(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const roleId = String(formData.get("roleId") ?? "").trim();
  const candidateId = String(formData.get("candidateId") ?? "").trim();
  const actionRaw = String(formData.get("action") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!roleId || !candidateId || !ACTIONS.has(actionRaw as never)) {
    return { ok: false as const, error: "Missing review fields." };
  }
  const action = actionRaw as "approved" | "rejected" | "flagged" | "note";
  if (action === "note" && !note) {
    return { ok: false as const, error: "Write a note first." };
  }
  try {
    await recordReviewAction(supabase, {
      roleId,
      candidateId,
      actorId: user.id,
      actorEmail: user.email ?? null,
      action,
      note,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save the review.";
    if (/match_reviews|match_review_audit|schema cache/i.test(message)) {
      return {
        ok: false as const,
        error: "Match reviews are not live yet. Run migration 0023.",
      };
    }
    return { ok: false as const, error: message };
  }
  revalidatePath("/admin/matches");
  revalidatePath(`/admin/matches/${roleId}/${candidateId}`);
  return { ok: true as const };
}
