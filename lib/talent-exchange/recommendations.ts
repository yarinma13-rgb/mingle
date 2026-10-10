/**
 * Cross-company match recommendation for the post-rejection talent
 * exchange: scores a candidate against every currently-open role at every
 * OTHER company (excluding whichever company just declined them), reusing
 * the existing deterministic matching engine rather than a new scorer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  loadCompanyRoles,
  loadOpenRolesAcrossOtherCompanies,
  type RoleRecord,
} from "@/lib/roles/persistence";
import { loadCompanyMatchInput, loadTalentMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";
import type { CandidateVisibilityStatus } from "@/lib/talent-exchange/persistence";

/**
 * Configurable, not hard-coded — the product spec explicitly calls for a
 * tunable threshold rather than a magic number buried in logic.
 */
export const TALENT_EXCHANGE_MATCH_THRESHOLD = Number(
  process.env.TALENT_EXCHANGE_MATCH_THRESHOLD ?? 75,
);

export type CrossCompanyOpportunity = {
  role: RoleRecord;
  score: number;
};

export async function findCrossCompanyOpportunities(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  excludeCompanyId?: string,
  threshold: number = TALENT_EXCHANGE_MATCH_THRESHOLD,
): Promise<CrossCompanyOpportunity[]> {
  const talentInput = await loadTalentMatchInput(supabase, candidateId);
  if (!talentInput) return [];

  const openRoles = await loadOpenRolesAcrossOtherCompanies(supabase, excludeCompanyId);
  if (openRoles.length === 0) return [];

  const companyInputCache = new Map<string, CompanyMatchInput | null>();
  const results: CrossCompanyOpportunity[] = [];

  for (const role of openRoles) {
    let companyInput = companyInputCache.get(role.companyId);
    if (companyInput === undefined) {
      companyInput = await loadCompanyMatchInput(supabase, role.companyId);
      companyInputCache.set(role.companyId, companyInput);
    }
    if (!companyInput) continue;

    const scopedCompanyInput: CompanyMatchInput = {
      ...companyInput,
      roleTitle: role.title,
      roleDepartment: role.department,
      roleRequiredSkills: role.requiredSkills,
      roleSkillRequirements: role.skillRequirements,
      salaryMin: role.salaryMin,
      salaryMax: role.salaryMax,
    };

    const result = computeMatch(talentInput, scopedCompanyInput);
    if (result.score >= threshold) {
      results.push({ role, score: result.score });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export type DiscoverableCandidateMatch = {
  candidateId: string;
  visibilityStatus: CandidateVisibilityStatus;
  role: RoleRecord;
  score: number;
};

/**
 * The reverse of findCrossCompanyOpportunities: candidates who opted into
 * discoverable/open_to_opportunities and score well against one of THIS
 * company's own open roles. Excludes any pairing already resolved
 * (mutual or the candidate already said not interested) — those are no
 * longer actionable on the Talent Exchange screen. When a candidate
 * matches more than one open role here, only their single best-scoring
 * role is kept, so the same person never appears twice in one company's
 * list.
 */
export async function findTalentExchangeCandidatesForCompany(
  supabase: SupabaseClient<Database>,
  companyId: string,
  threshold: number = TALENT_EXCHANGE_MATCH_THRESHOLD,
): Promise<DiscoverableCandidateMatch[]> {
  const [allRoles, { data: visibleCandidates }] = await Promise.all([
    loadCompanyRoles(supabase, companyId),
    supabase
      .from("candidate_visibility")
      .select("candidate_id, status")
      .in("status", ["discoverable", "open_to_opportunities"]),
  ]);
  const openRoles = allRoles.filter((role) => role.status === "open");
  if (openRoles.length === 0 || !visibleCandidates || visibleCandidates.length === 0) {
    return [];
  }

  const { data: resolvedInterests } = await supabase
    .from("talent_exchange_interest")
    .select("match_id")
    .in("status", ["mutual", "candidate_declined"]);
  const { data: resolvedMatches } = resolvedInterests && resolvedInterests.length > 0
    ? await supabase
        .from("matches")
        .select("id, candidate_id, role_id")
        .in("id", resolvedInterests.map((row) => row.match_id))
    : { data: [] as { id: string; candidate_id: string; role_id: string | null }[] };
  const resolvedPairs = new Set(
    (resolvedMatches ?? []).map((row) => `${row.candidate_id}:${row.role_id}`),
  );

  const companyInput = await loadCompanyMatchInput(supabase, companyId);
  if (!companyInput) return [];

  const bestByCandidate = new Map<string, DiscoverableCandidateMatch>();

  for (const candidateRow of visibleCandidates) {
    const talentInput = await loadTalentMatchInput(supabase, candidateRow.candidate_id);
    if (!talentInput) continue;

    for (const role of openRoles) {
      if (resolvedPairs.has(`${candidateRow.candidate_id}:${role.id}`)) continue;

      const scopedCompanyInput: CompanyMatchInput = {
        ...companyInput,
        roleTitle: role.title,
        roleDepartment: role.department,
        roleRequiredSkills: role.requiredSkills,
        roleSkillRequirements: role.skillRequirements,
        salaryMin: role.salaryMin,
        salaryMax: role.salaryMax,
      };
      const result = computeMatch(talentInput, scopedCompanyInput);
      if (result.score < threshold) continue;

      const existing = bestByCandidate.get(candidateRow.candidate_id);
      if (!existing || result.score > existing.score) {
        bestByCandidate.set(candidateRow.candidate_id, {
          candidateId: candidateRow.candidate_id,
          visibilityStatus: candidateRow.status as CandidateVisibilityStatus,
          role,
          score: result.score,
        });
      }
    }
  }

  return [...bestByCandidate.values()].sort((a, b) => b.score - a.score);
}
