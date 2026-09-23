/**
 * Optional Gemini narration over a deterministic MatchReport.
 * Never invents skills, experience, or motivation — only rephrases
 * existing evidence into recruiter-friendly copy.
 */

import { GeminiError, geminiApiKey, geminiGenerateJson } from "@/lib/ai/gemini";
import type { MatchReport } from "@/lib/matching/report";

export type MatchNarration = {
  summary: string;
  whyBullets: string[];
  riskBullets: string[];
  validateBullets: string[];
  nextStepBlurb: string;
  usedAi: boolean;
};

type GeminiNarrationPayload = {
  summary?: string;
  whyBullets?: string[];
  riskBullets?: string[];
  validateBullets?: string[];
  nextStepBlurb?: string;
};

function asLines(value: unknown, max = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function fallbackNarration(report: MatchReport): MatchNarration {
  return {
    summary: report.mutualSummary || report.whatMattersMost,
    whyBullets: report.why.slice(0, 5).map((b) => `${b.label}: ${b.finding}`),
    riskBullets: report.risks
      .slice(0, 5)
      .map((r) => `${r.label} (${r.gapKind}): ${r.finding}`),
    validateBullets: report.whatToValidate.slice(0, 5),
    nextStepBlurb: `${report.recommendedNextStep}. ${report.nextStepReason}`,
    usedAi: false,
  };
}

/**
 * Produce recruiter-facing narration. Falls back to deterministic copy
 * when Gemini is unset or fails — scoring is never affected.
 */
export async function narrateMatchReport(
  report: MatchReport,
): Promise<MatchNarration> {
  if (!geminiApiKey()) return fallbackNarration(report);

  const system = `You are mingle's recruiting intelligence narrator.
Rewrite ONLY from the provided JSON evidence.
Rules:
- Never invent skills, experience, motivation, personality, or company facts.
- If something is unknown, say it is not yet validated.
- Keep bullets short, specific, and evidence-based.
- Hebrew or English is fine; match the language of the evidence when clear.
- Return JSON: summary, whyBullets[], riskBullets[], validateBullets[], nextStepBlurb.`;

  const user = JSON.stringify(
    {
      overall: report.overall,
      confidence: report.confidence,
      confidenceReason: report.confidenceReason,
      mutualSummary: report.mutualSummary,
      axes: report.axes,
      why: report.why,
      risks: report.risks,
      whatToValidate: report.whatToValidate,
      recommendedNextStep: report.recommendedNextStep,
      nextStepReason: report.nextStepReason,
      technicalSignal: report.technicalSignal,
    },
    null,
    2,
  );

  try {
    const raw = await geminiGenerateJson<GeminiNarrationPayload>({
      system,
      user,
    });
    const narration: MatchNarration = {
      summary:
        typeof raw.summary === "string" && raw.summary.trim()
          ? raw.summary.trim().slice(0, 400)
          : report.mutualSummary,
      whyBullets: asLines(raw.whyBullets),
      riskBullets: asLines(raw.riskBullets),
      validateBullets: asLines(raw.validateBullets),
      nextStepBlurb:
        typeof raw.nextStepBlurb === "string" && raw.nextStepBlurb.trim()
          ? raw.nextStepBlurb.trim().slice(0, 300)
          : `${report.recommendedNextStep}. ${report.nextStepReason}`,
      usedAi: true,
    };
    if (narration.whyBullets.length === 0) {
      narration.whyBullets = fallbackNarration(report).whyBullets;
    }
    return narration;
  } catch (error) {
    if (error instanceof GeminiError) {
      return fallbackNarration(report);
    }
    return fallbackNarration(report);
  }
}
