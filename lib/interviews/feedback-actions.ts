"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isActiveCompanyMember } from "@/lib/team/persistence";
import { getOrCreateMatchId } from "@/lib/matching/match-anchor";

const schema = z.object({
  connectionId: z.string().uuid(),
  companyId: z.string().uuid(),
  candidateId: z.string().uuid(),
  roleId: z.string().uuid().nullable(),
  technicalFit: z.number().int().min(1).max(5).nullable(),
  roleFit: z.number().int().min(1).max(5).nullable(),
  teamFit: z.number().int().min(1).max(5).nullable(),
  motivationFit: z.number().int().min(1).max(5).nullable(),
  recommendation: z.string().trim().max(60),
  notes: z.string().trim().max(1000),
});

export type SubmitInterviewFeedbackInput = z.infer<typeof schema>;

/**
 * First real write to public.interview_feedback (schema existed since
 * 0024, unused until now) — see Phase 5 of the matching-engine upgrade.
 * employment_outcomes stays deliberately unwired: there's no "hired"
 * signal in relationship_events yet to key off of.
 */
export async function submitInterviewFeedbackAction(
  input: SubmitInterviewFeedbackInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form" };
  }
  const { companyId, candidateId, roleId, technicalFit, roleFit, teamFit, motivationFit, recommendation, notes } =
    parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };
  const isCompanySide =
    user.id === companyId || (await isActiveCompanyMember(supabase, user.id, companyId));
  if (!isCompanySide) return { ok: false, error: "Not authorized." };

  let matchId: string;
  try {
    matchId = await getOrCreateMatchId(supabase, { companyId, candidateId, roleId });
  } catch (error) {
    console.error("submitInterviewFeedbackAction: getOrCreateMatchId failed", error);
    return { ok: false, error: "Could not save feedback right now." };
  }

  const { error } = await supabase.from("interview_feedback").insert({
    match_id: matchId,
    interviewer_id: user.id,
    technical_fit: technicalFit,
    role_fit: roleFit,
    team_fit: teamFit,
    motivation_fit: motivationFit,
    recommendation: recommendation || null,
    notes: notes || null,
  });
  if (error) {
    console.error("submitInterviewFeedbackAction: insert failed", error);
    return { ok: false, error: "Could not save feedback right now." };
  }
  return { ok: true };
}
