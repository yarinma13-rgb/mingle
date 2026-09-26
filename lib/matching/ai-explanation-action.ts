"use server";

import { createClient } from "@/lib/supabase/server";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";
import { buildMatchReport, type MatchAudience } from "@/lib/matching/report";
import {
  generateAiMatchExplanation,
  buildAndHashEvidence,
  type AiMatchExplanation,
} from "@/lib/matching/ai-explanation";
import {
  getOrCreateMatchId,
  persistExplanation,
  readCachedExplanation,
} from "@/lib/matching/match-anchor";
import { loadCompanyRole } from "@/lib/roles/persistence";
import { isActiveCompanyMember } from "@/lib/team/persistence";

export type FetchAiMatchExplanationResult =
  | { ok: true; explanation: AiMatchExplanation }
  | { ok: false; error: string };

/**
 * Called on-demand when a recruiter/candidate opens a single match (never
 * for a whole list) — see components/matching/MatchReport.tsx. Cache-first;
 * only calls the LLM on a real miss.
 */
export async function fetchAiMatchExplanation(params: {
  companyId: string;
  candidateId: string;
  roleId?: string | null;
}): Promise<FetchAiMatchExplanationResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to see match intelligence." };
  const isCompanySide =
    user.id === params.companyId ||
    (await isActiveCompanyMember(supabase, user.id, params.companyId));
  if (!isCompanySide && user.id !== params.candidateId) {
    return { ok: false, error: "Not authorized for this match." };
  }

  const audience: MatchAudience = isCompanySide ? "company" : "talent";
  const roleId = params.roleId ?? null;

  const [talentInput, companyInputBase] = await Promise.all([
    loadTalentMatchInput(supabase, params.candidateId),
    loadCompanyMatchInput(supabase, params.companyId),
  ]);
  if (!talentInput || !companyInputBase) {
    return { ok: false, error: "Both profiles need to be complete first." };
  }

  let companyInput: CompanyMatchInput = companyInputBase;
  if (roleId) {
    const role = await loadCompanyRole(supabase, roleId, params.companyId);
    if (role) {
      companyInput = {
        ...companyInputBase,
        roleTitle: role.title,
        roleDepartment: role.department,
        roleRequiredSkills: role.requiredSkills,
        roleSkillRequirements: role.skillRequirements,
        salaryMin: role.salaryMin,
        salaryMax: role.salaryMax,
      };
    }
  }

  const result = computeMatch(talentInput, companyInput);
  const report = buildMatchReport(result, talentInput, companyInput, audience);
  const { hash } = buildAndHashEvidence(result, report, companyInput);

  let matchId: string;
  try {
    matchId = await getOrCreateMatchId(supabase, {
      companyId: params.companyId,
      candidateId: params.candidateId,
      roleId,
    });
  } catch (error) {
    console.error("fetchAiMatchExplanation: getOrCreateMatchId failed", error);
    // No anchor, no cache/persistence — still answer the user's question.
    const explanation = await generateAiMatchExplanation(result, report, companyInput);
    return { ok: true, explanation };
  }

  const cached = await readCachedExplanation(supabase, matchId, hash);
  if (cached) return { ok: true, explanation: cached };

  const explanation = await generateAiMatchExplanation(result, report, companyInput);
  await persistExplanation(supabase, matchId, hash, result, report, explanation);
  return { ok: true, explanation };
}
