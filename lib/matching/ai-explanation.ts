/**
 * On-demand AI reasoning layer, built ONLY on top of evidence the
 * deterministic engine (engine.ts) and rule-based intelligence layer
 * (intelligence.ts) already computed — never on raw profile/JD text. This
 * is deliberate: the LLM's job is to explain and prioritize evidence that
 * already exists, not to derive new "facts" from unstructured text, which
 * keeps fabrication risk low and every claim traceable to a real factor.
 *
 * Never called for a whole list/feed — only for a single opened match
 * (see components/matching/MatchReport.tsx). Cached in
 * public.match_explanations keyed by (match_id, input hash) so re-opening
 * the same pair with unchanged data never re-calls the LLM.
 */

import { createHash } from "crypto";
import { geminiApiKey, geminiGenerateJson } from "@/lib/ai/gemini";
import type { MatchBullet, MatchReport } from "@/lib/matching/report";
import type { MatchFactor, MatchResult, TalentMatchInput, CompanyMatchInput } from "@/lib/matching/engine";
import type { MatchRisk, RecommendedNextStep, GapKind, EvidenceKind } from "@/lib/matching/intelligence";
import { SKILL_TIERS } from "@/lib/matching/skill-requirement-tiers";

export const AI_EXPLANATION_MODEL_VERSION = "gemini-match-explainer-v1";
const FALLBACK_MODEL_VERSION = "deterministic-fallback";

export type AiMatchExplanation = {
  why: MatchBullet[];
  whyNot: MatchRisk[];
  whatToValidate: string[];
  recommendedNextStep: { step: RecommendedNextStep; reason: string };
  generatedAt: string;
  modelVersion: string;
  /** "ai" = a real Gemini call produced this; "fallback" = deterministic only. */
  source: "ai" | "fallback";
};

type EvidencePayload = {
  overall: number;
  audience: string;
  axes: { id: string; label: string; score: number }[];
  confidence: string;
  confidenceReason: string;
  factors: {
    key: string;
    label: string;
    weight: number;
    fraction: number;
    verdict: string;
    detail: string;
  }[];
  skillTiers: { skill: string; tier: string; rationale?: string }[];
  baseline: {
    why: MatchBullet[];
    risks: MatchRisk[];
    whatToValidate: string[];
    recommendedNextStep: RecommendedNextStep;
    nextStepReason: string;
    mutualSummary: string;
  };
};

/** Build the exact (and only) evidence the LLM is allowed to see. */
function buildEvidencePayload(
  result: MatchResult,
  report: MatchReport,
  company: CompanyMatchInput | null,
): EvidencePayload {
  return {
    overall: report.overall,
    audience: report.audience,
    axes: report.axes,
    confidence: report.confidence,
    confidenceReason: report.confidenceReason,
    factors: result.factors.map((f: MatchFactor) => ({
      key: f.key,
      label: f.label,
      weight: f.weight,
      fraction: f.fraction,
      verdict: f.verdict,
      detail: f.detail,
    })),
    skillTiers: (company?.roleSkillRequirements ?? []).map((r) => ({
      skill: r.skill,
      tier: r.tier,
      rationale: r.rationale,
    })),
    baseline: {
      why: report.why,
      risks: report.risks,
      whatToValidate: report.whatToValidate,
      recommendedNextStep: report.recommendedNextStep,
      nextStepReason: report.nextStepReason,
      mutualSummary: report.mutualSummary,
    },
  };
}

/** Stable hash of the evidence — cache key. Same evidence in, same key out. */
export function hashEvidence(payload: EvidencePayload): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildAndHashEvidence(
  result: MatchResult,
  report: MatchReport,
  company: CompanyMatchInput | null,
) {
  const payload = buildEvidencePayload(result, report, company);
  return { payload, hash: hashEvidence(payload) };
}

function fallbackExplanation(report: MatchReport): AiMatchExplanation {
  return {
    why: report.why,
    whyNot: report.risks,
    whatToValidate: report.whatToValidate,
    recommendedNextStep: {
      step: report.recommendedNextStep,
      reason: report.nextStepReason,
    },
    generatedAt: new Date().toISOString(),
    modelVersion: FALLBACK_MODEL_VERSION,
    source: "fallback",
  };
}

const RECOMMENDED_NEXT_STEPS: readonly RecommendedNextStep[] = [
  "HR Interview",
  "Hiring Manager Interview",
  "Team Conversation",
  "Request More Information",
  "Validate Key Risk",
  "Hold",
  "Not Enough Information",
];
const GAP_KINDS: readonly GapKind[] = ["hard", "development", "preference", "unknown"];
const EVIDENCE_KINDS: readonly EvidenceKind[] = ["fact", "inference", "unknown"];

type GeminiExplanationPayload = {
  why?: { key?: string; label?: string; finding?: string; evidence?: string }[];
  whyNot?: {
    key?: string;
    label?: string;
    finding?: string;
    gapKind?: string;
    evidence?: string;
  }[];
  whatToValidate?: string[];
  recommendedNextStep?: { step?: string; reason?: string };
};

/** Only ever keep bullets whose factor key was actually in the evidence we
 * sent — refuses anything the model tries to introduce out of thin air. */
function normalize(
  raw: GeminiExplanationPayload,
  evidence: EvidencePayload,
  report: MatchReport,
): AiMatchExplanation {
  const knownKeys = new Set(evidence.factors.map((f) => f.key));

  const why: MatchBullet[] = Array.isArray(raw.why)
    ? raw.why
        .filter((b) => typeof b?.finding === "string" && b.finding.trim())
        .map((b) => {
          const key = typeof b.key === "string" && knownKeys.has(b.key) ? b.key : undefined;
          const source = key
            ? evidence.factors.find((f) => f.key === key)
            : undefined;
          return {
            key: (key ?? report.why[0]?.key ?? "skills") as MatchBullet["key"],
            label: (typeof b.label === "string" && b.label) || source?.label || "Signal",
            finding: b.finding!.trim().slice(0, 220),
            evidence: EVIDENCE_KINDS.includes(b.evidence as EvidenceKind)
              ? (b.evidence as EvidenceKind)
              : "fact",
          };
        })
        .slice(0, 5)
    : report.why;

  const whyNot: MatchRisk[] = Array.isArray(raw.whyNot)
    ? raw.whyNot
        .filter((r) => typeof r?.finding === "string" && r.finding.trim())
        .map((r) => {
          const key = typeof r.key === "string" && knownKeys.has(r.key) ? r.key : undefined;
          const source = key
            ? evidence.factors.find((f) => f.key === key)
            : undefined;
          return {
            key: (key ?? report.risks[0]?.key ?? "skills") as MatchRisk["key"],
            label: (typeof r.label === "string" && r.label) || source?.label || "Risk",
            finding: r.finding!.trim().slice(0, 220),
            gapKind: GAP_KINDS.includes(r.gapKind as GapKind)
              ? (r.gapKind as GapKind)
              : "unknown",
            evidence: EVIDENCE_KINDS.includes(r.evidence as EvidenceKind)
              ? (r.evidence as EvidenceKind)
              : "unknown",
          };
        })
        .slice(0, 6)
    : report.risks;

  const whatToValidate =
    Array.isArray(raw.whatToValidate) && raw.whatToValidate.length > 0
      ? raw.whatToValidate
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q) => q.trim().slice(0, 200))
          .slice(0, 5)
      : report.whatToValidate;

  const step = RECOMMENDED_NEXT_STEPS.includes(
    raw.recommendedNextStep?.step as RecommendedNextStep,
  )
    ? (raw.recommendedNextStep!.step as RecommendedNextStep)
    : report.recommendedNextStep;
  const reason =
    typeof raw.recommendedNextStep?.reason === "string" && raw.recommendedNextStep.reason.trim()
      ? raw.recommendedNextStep.reason.trim().slice(0, 300)
      : report.nextStepReason;

  return {
    why,
    whyNot,
    whatToValidate,
    recommendedNextStep: { step, reason },
    generatedAt: new Date().toISOString(),
    modelVersion: AI_EXPLANATION_MODEL_VERSION,
    source: "ai",
  };
}

/**
 * Generate (or degrade gracefully from) the AI explanation layer. Pure
 * function of already-computed evidence — no DB access, no caching. The
 * caller (a server action) owns the cache lookup/write around this.
 */
export async function generateAiMatchExplanation(
  result: MatchResult,
  report: MatchReport,
  company: CompanyMatchInput | null,
): Promise<AiMatchExplanation> {
  if (!geminiApiKey()) return fallbackExplanation(report);

  const evidence = buildEvidencePayload(result, report, company);

  try {
    const raw = await geminiGenerateJson<GeminiExplanationPayload>({
      system: [
        "You are a recruiting-intelligence assistant. You will receive JSON",
        "evidence already computed by a deterministic matching engine:",
        "per-factor scores/verdicts/details, skill-requirement tiers",
        `(${SKILL_TIERS.join(", ")}), and a baseline rule-based explanation.`,
        "Your job is ONLY to write clearer, better-prioritized explanations",
        "GROUNDED EXCLUSIVELY in that evidence. Never invent a skill, fact,",
        "experience, or motivation that is not present in the evidence.",
        "If the evidence is thin for a claim, keep it in the baseline wording",
        "or mark it as inference rather than stating it as settled fact.",
        "Return JSON only with keys: why, whyNot, whatToValidate, recommendedNextStep.",
        "why: up to 5 items {key, label, finding, evidence}, key must be one of",
        "the factor keys in the evidence, evidence must be 'fact' or 'inference'.",
        "whyNot: up to 6 items {key, label, finding, gapKind, evidence}, gapKind must be one of",
        `${GAP_KINDS.join(", ")}, evidence must be one of ${EVIDENCE_KINDS.join(", ")}.`,
        "whatToValidate: up to 5 short actionable interview-prep questions.",
        `recommendedNextStep: {step, reason} where step is exactly one of: ${RECOMMENDED_NEXT_STEPS.join(", ")}.`,
        "Keep every finding under ~25 words. Do not use generic filler like",
        "'excellent candidate with great potential' — every sentence must cite",
        "something concrete from the evidence.",
      ].join(" "),
      user: JSON.stringify(evidence),
    });
    return normalize(raw, evidence, report);
  } catch {
    return fallbackExplanation(report);
  }
}
