/**
 * Builds the anonymous candidate card a company sees on the Talent
 * Exchange before mutual interest. Deliberately does NOT import
 * loadDisplayInfoForUsers (lib/connections/enrich.ts) — that function
 * always returns name + photo, which is exactly what must never appear
 * here. Only reads profile fields that are safe to show pre-identity, and
 * never queries anything about the candidate's prior company/process
 * (no rejection reason, interview notes, interviewer opinion, or salary
 * history — those live on other tables this module simply never touches).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { loadTalentMatchInput, loadCompanyMatchInput } from "@/lib/matching/context";
import { computeMatch, type CompanyMatchInput } from "@/lib/matching/engine";
import { buildMatchReport, type MatchReport } from "@/lib/matching/report";
import { getOrCreateMatchId } from "@/lib/matching/match-anchor";
import type { RoleRecord } from "@/lib/roles/persistence";

export type AnonymousCandidateCard = {
  matchId: string;
  roleTitle: string | null;
  seniority: string | null;
  yearsExperience: number | null;
  industry: string | null;
  location: string | null;
  salaryRangeLabel: string | null;
  workModelPreference: string[];
  skills: string[];
  report: MatchReport;
};

function bandedSalaryLabel(expectation: number | null): string | null {
  if (!expectation || expectation <= 0) return null;
  // Round to the nearest 10k and show a band, not the exact figure —
  // exact salary stays gated behind mutual match per the product spec.
  const band = Math.round(expectation / 10_000) * 10_000;
  const low = Math.max(0, band - 10_000);
  const high = band + 10_000;
  return `${low.toLocaleString()}–${high.toLocaleString()}`;
}

export async function buildAnonymousCandidateCard(
  supabase: SupabaseClient<Database>,
  candidateId: string,
  role: RoleRecord,
): Promise<AnonymousCandidateCard | null> {
  const [talentInput, companyInput] = await Promise.all([
    loadTalentMatchInput(supabase, candidateId),
    loadCompanyMatchInput(supabase, role.companyId),
  ]);
  if (!talentInput || !companyInput) return null;

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
  const report = buildMatchReport(result, talentInput, scopedCompanyInput, "company");

  const matchId = await getOrCreateMatchId(supabase, {
    companyId: role.companyId,
    candidateId,
    roleId: role.id,
  });

  const profile = talentInput.profile;

  return {
    matchId,
    roleTitle: profile.currentRole || profile.targetRole || null,
    seniority: profile.currentRole || null,
    yearsExperience: profile.yearsExperience,
    industry: profile.industry || null,
    location: profile.location || null,
    salaryRangeLabel: bandedSalaryLabel(profile.salaryExpectation),
    workModelPreference: profile.lookingFor,
    skills: profile.skills,
    report,
  };
}
