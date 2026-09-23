/**
 * Outcome-learning hooks for future recruiting intelligence.
 *
 * Schema already exists (supabase/migrations/0024_pilot_learning_tables.sql):
 *   model_versions, match_feature_snapshots, match_evidence,
 *   interview_feedback, employment_outcomes
 *
 * This module packages a MatchReport into a feature snapshot shape so
 * future writers can persist Match → Interview → Decision → 30/90-day
 * feedback without changing the scoring path.
 *
 * Do NOT claim predictive accuracy until real outcome volume exists.
 */

import type { MatchReport } from "@/lib/matching/report";
import type { MatchResult } from "@/lib/matching/engine";

export const CURRENT_MODEL_VERSION = "v1-heuristic-overlap-intelligence";

export type MatchFeatureSnapshotPayload = {
  modelVersion: string;
  overall: number;
  confidence: MatchReport["confidence"];
  axes: MatchReport["axes"];
  discoveryTier: MatchReport["discoveryTier"];
  recommendedNextStep: MatchReport["recommendedNextStep"];
  riskGapKinds: string[];
  whyKeys: string[];
  factorFractions: Record<string, number>;
  capturedAt: string;
};

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
    axes: report.axes,
    discoveryTier: report.discoveryTier,
    recommendedNextStep: report.recommendedNextStep,
    riskGapKinds: report.risks.map((r) => r.gapKind),
    whyKeys: report.why.map((w) => w.key),
    factorFractions,
    capturedAt: new Date().toISOString(),
  };
}
