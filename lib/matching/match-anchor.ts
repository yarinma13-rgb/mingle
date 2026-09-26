/**
 * Stable "this candidate x this role/company" anchor row (public.matches,
 * migration 0038) plus the cache and feature/evidence writes layered on
 * top of it. Nothing here calls the LLM — see ai-explanation.ts for that;
 * this module is pure persistence around whatever explanation it produces.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import type { MatchResult } from "@/lib/matching/engine";
import type { MatchReport } from "@/lib/matching/report";
import {
  AI_EXPLANATION_MODEL_VERSION,
  type AiMatchExplanation,
} from "@/lib/matching/ai-explanation";

const CURRENT_MODEL_VERSION = "v1-heuristic-overlap-intelligence";

export type MatchAnchorParams = {
  companyId: string;
  candidateId: string;
  roleId: string | null;
};

/** Get-or-create the stable matches row for this pairing. */
function selectByPairing(
  supabase: SupabaseClient<Database>,
  params: MatchAnchorParams,
) {
  let query = supabase
    .from("matches")
    .select("id")
    .eq("company_id", params.companyId)
    .eq("candidate_id", params.candidateId);
  // PostgREST .eq() never matches NULL — a null role_id needs .is() instead.
  query = params.roleId ? query.eq("role_id", params.roleId) : query.is("role_id", null);
  return query.maybeSingle();
}

export async function getOrCreateMatchId(
  supabase: SupabaseClient<Database>,
  params: MatchAnchorParams,
): Promise<string> {
  const existing = await selectByPairing(supabase, params);
  if (existing.data?.id) return existing.data.id;

  const inserted = await supabase
    .from("matches")
    .insert({
      company_id: params.companyId,
      candidate_id: params.candidateId,
      role_id: params.roleId,
    })
    .select("id")
    .single();

  if (inserted.error) {
    // Unique-constraint race: someone else created it between our select
    // and insert — re-select rather than failing the request.
    const retry = await selectByPairing(supabase, params);
    if (retry.data?.id) return retry.data.id;
    throw inserted.error;
  }

  return inserted.data.id;
}

export async function readCachedExplanation(
  supabase: SupabaseClient<Database>,
  matchId: string,
  inputHash: string,
): Promise<AiMatchExplanation | null> {
  const { data } = await supabase
    .from("match_explanations")
    .select("intelligence_json")
    .eq("match_id", matchId)
    .eq("input_hash", inputHash)
    .maybeSingle();
  if (!data) return null;
  return data.intelligence_json as unknown as AiMatchExplanation;
}

/** Persist a freshly generated explanation: the cache row, one feature
 * snapshot, and one evidence row per why/whyNot bullet. Best-effort —
 * failures here must never break the response the user is waiting on. */
export async function persistExplanation(
  supabase: SupabaseClient<Database>,
  matchId: string,
  inputHash: string,
  result: MatchResult,
  report: MatchReport,
  explanation: AiMatchExplanation,
): Promise<void> {
  try {
    await supabase.from("match_explanations").insert({
      match_id: matchId,
      input_hash: inputHash,
      intelligence_json: explanation as unknown as Record<string, unknown>,
      model_version: explanation.modelVersion,
    });
  } catch (error) {
    console.error("persistExplanation: match_explanations insert failed", error);
  }

  try {
    await supabase.from("match_feature_snapshots").insert({
      match_id: matchId,
      model_version: CURRENT_MODEL_VERSION,
      features_json: {
        overall: result.score,
        axes: report.axes,
        confidence: report.confidence,
        discoveryTier: report.discoveryTier,
        recommendedNextStep: explanation.recommendedNextStep.step,
        explanationSource: explanation.source,
        factorFractions: Object.fromEntries(
          result.factors.map((f) => [f.key, f.fraction]),
        ),
      },
    });
  } catch (error) {
    console.error("persistExplanation: match_feature_snapshots insert failed", error);
  }

  try {
    const rows = [
      ...explanation.why.map((bullet) => ({
        match_id: matchId,
        feature: bullet.key,
        evidence_type: bullet.evidence ?? "fact",
        source: AI_EXPLANATION_MODEL_VERSION,
        candidate_value: bullet.finding,
        confidence: report.confidence,
      })),
      ...explanation.whyNot.map((risk) => ({
        match_id: matchId,
        feature: risk.key,
        evidence_type: risk.evidence,
        source: AI_EXPLANATION_MODEL_VERSION,
        candidate_value: risk.finding,
        confidence: report.confidence,
      })),
    ];
    if (rows.length > 0) {
      await supabase.from("match_evidence").insert(rows);
    }
  } catch (error) {
    console.error("persistExplanation: match_evidence insert failed", error);
  }
}
