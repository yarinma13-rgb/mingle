/**
 * Cross-company match recommendation for the post-rejection talent
 * exchange: scores a candidate against every currently-open role at every
 * OTHER company (excluding whichever company just declined them), reusing
 * the existing deterministic matching engine rather than a new scorer.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadOpenRolesAcrossOtherCompanies, type RoleRecord } from "@/lib/roles/persistence";
import { loadCompanyMatchInput, loadTalentMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";

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
  excludeCompanyId: string,
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
