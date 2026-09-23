/**
 * Outcome-learning persistence for recruiting intelligence.
 *
 * Match → snapshot/evidence → interview feedback → employment outcomes.
 * Scoring stays deterministic; this layer only records what happened.
 *
 * Do NOT claim predictive accuracy until real outcome volume exists.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import type { Database } from "@/lib/supabase/types";
import type { MatchReport } from "@/lib/matching/report";
import type { MatchResult } from "@/lib/matching/engine";
import { createAdminClient } from "@/lib/supabase/admin";

export const CURRENT_MODEL_VERSION = "v1-heuristic-overlap-intelligence";

export type MatchFeatureSnapshotPayload = {
  modelVersion: string;
  overall: number;
  confidence: MatchReport["confidence"];
  confidenceReason: string;
  axes: MatchReport["axes"];
  discoveryTier: MatchReport["discoveryTier"];
  recommendedNextStep: MatchReport["recommendedNextStep"];
  mutualSummary: string;
  riskGapKinds: string[];
  whyKeys: string[];
  factorFractions: Record<string, number>;
  capturedAt: string;
};

/** Stable uuid-shaped id for a company↔talent(+role) pair. */
export function stableMatchId(
  companyId: string,
  talentId: string,
  roleId?: string | null,
): string {
  const digest = createHash("sha256")
    .update(`${companyId}:${talentId}:${roleId ?? ""}`)
    .digest();
  const bytes = Buffer.from(digest.subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function buildMatchFeatureSnapshot(
  report: MatchReport,
  result: MatchResult,
): MatchFeatureSnapshotPayload {
  const factorFractions: Record<string, number> = {};
  for (const factor of result.factors) {
    factorFractions[factor.key] = factor.fraction;
  }
  return {
    modelVersion: CURRENT_MODEL_VERSION,
    overall: report.overall,
    confidence: report.confidence,
    confidenceReason: report.confidenceReason,
    axes: report.axes,
    discoveryTier: report.discoveryTier,
    recommendedNextStep: report.recommendedNextStep,
    mutualSummary: report.mutualSummary,
    riskGapKinds: report.risks.map((r) => r.gapKind),
    whyKeys: report.why.map((w) => w.key),
    factorFractions,
    capturedAt: new Date().toISOString(),
  };
}

type Db = SupabaseClient<Database>;

function writerClient(prefer: Db | null): Db | null {
  return createAdminClient() ?? prefer;
}

export async function persistMatchLearning(input: {
  supabase?: Db | null;
  companyId: string;
  talentId: string;
  roleId?: string | null;
  audience: MatchReport["audience"];
  report: MatchReport;
  result: MatchResult;
}): Promise<{ matchId: string; ok: boolean }> {
  const matchId = stableMatchId(
    input.companyId,
    input.talentId,
    input.roleId,
  );
  const client = writerClient(input.supabase ?? null);
  if (!client) return { matchId, ok: false };

  const features = buildMatchFeatureSnapshot(input.report, input.result);
  const { error: snapError } = await client.from("match_feature_snapshots").insert({
    match_id: matchId,
    company_id: input.companyId,
    talent_id: input.talentId,
    role_id: input.roleId ?? null,
    audience: input.audience,
    model_version: CURRENT_MODEL_VERSION,
    features_json: features as unknown as Record<string, unknown>,
  } as never);

  if (snapError) {
    return { matchId, ok: false };
  }

  const evidenceRows = input.result.factors.map((factor) => ({
    match_id: matchId,
    company_id: input.companyId,
    talent_id: input.talentId,
    feature: factor.key,
    evidence_type: factor.verdict,
    source: "computeMatch",
    source_reference: factor.label,
    candidate_value: null,
    company_value: null,
    contribution: Number((factor.fraction * factor.weight).toFixed(2)),
    confidence: input.report.confidence,
  }));

  if (evidenceRows.length > 0) {
    await client.from("match_evidence").insert(evidenceRows as never);
  }

  return { matchId, ok: true };
}

export type InterviewFeedbackInput = {
  companyId: string;
  talentId: string;
  interviewerId: string;
  interviewId?: string | null;
  roleId?: string | null;
  technicalFit?: number | null;
  roleFit?: number | null;
  teamFit?: number | null;
  motivationFit?: number | null;
  recommendation?: string | null;
  notes?: string | null;
};

export async function saveInterviewFeedback(
  supabase: Db,
  input: InterviewFeedbackInput,
): Promise<{ ok: true; matchId: string } | { ok: false; error: string }> {
  const matchId = stableMatchId(
    input.companyId,
    input.talentId,
    input.roleId,
  );
  const client = writerClient(supabase) ?? supabase;
  const { error } = await client.from("interview_feedback").insert({
    match_id: matchId,
    company_id: input.companyId,
    talent_id: input.talentId,
    interviewer_id: input.interviewerId,
    interview_id: input.interviewId ?? null,
    technical_fit: input.technicalFit ?? null,
    role_fit: input.roleFit ?? null,
    team_fit: input.teamFit ?? null,
    motivation_fit: input.motivationFit ?? null,
    recommendation: input.recommendation ?? null,
    notes: input.notes ?? null,
  } as never);
  if (error) return { ok: false, error: error.message };
  return { ok: true, matchId };
}

export type EmploymentOutcomeInput = {
  companyId: string;
  talentId: string;
  roleId?: string | null;
  hireDate?: string | null;
  day30Status?: string | null;
  day30Feedback?: string | null;
  day90Status?: string | null;
  day90Feedback?: string | null;
  retained?: boolean | null;
  satisfactionScore?: number | null;
};

export async function upsertEmploymentOutcome(
  supabase: Db,
  input: EmploymentOutcomeInput,
): Promise<{ ok: true; matchId: string } | { ok: false; error: string }> {
  const matchId = stableMatchId(
    input.companyId,
    input.talentId,
    input.roleId,
  );
  const client = writerClient(supabase) ?? supabase;

  const { data: existing } = await client
    .from("employment_outcomes")
    .select("id")
    .eq("match_id", matchId)
    .maybeSingle();

  const row = {
    match_id: matchId,
    company_id: input.companyId,
    talent_id: input.talentId,
    role_id: input.roleId ?? null,
    hire_date: input.hireDate ?? null,
    day_30_status: input.day30Status ?? null,
    day_30_feedback: input.day30Feedback ?? null,
    day_90_status: input.day90Status ?? null,
    day_90_feedback: input.day90Feedback ?? null,
    retained: input.retained ?? null,
    satisfaction_score: input.satisfactionScore ?? null,
  };

  if (existing?.id) {
    const { error } = await client
      .from("employment_outcomes")
      .update(row as never)
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await client
      .from("employment_outcomes")
      .insert(row as never);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, matchId };
}
