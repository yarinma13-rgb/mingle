import { overlapCanonical } from "@/lib/matching/synonyms";
import { scoreBandLabel } from "@/lib/matching/score-tone";
import { technicalSignalFinding } from "@/lib/github/meta";
import { salaryGapPercent } from "@/lib/roles/salary-alignment";
import {
  buildIntelligenceExtras,
  computeMatchConfidence,
  evidenceForFactor,
  type DiscoveryTier,
  type EvidenceKind,
  type GapKind,
  type MatchAudience as IntelAudience,
  type MatchConfidence,
  type MatchRisk,
  type RecommendedNextStep,
} from "@/lib/matching/intelligence";
import type {
  MatchFactor,
  MatchFactorKey,
  MatchResult,
  TalentMatchInput,
  CompanyMatchInput,
} from "@/lib/matching/engine";

export type MatchAudience = IntelAudience;
export type { MatchConfidence };

export type MatchAxisId = "role" | "company" | "motivation";

export type MatchAxisScore = {
  id: MatchAxisId;
  label: string;
  score: number;
};

export type MatchBullet = {
  key: MatchFactorKey;
  label: string;
  finding: string;
  /** Fact vs inference vs unknown — never invent. */
  evidence?: EvidenceKind;
};

export type MatchReport = {
  overall: number;
  strength: string;
  axes: MatchAxisScore[];
  confidence: MatchConfidence;
  /** Why confidence is High / Medium / Low based on evidence quality. */
  confidenceReason: string;
  why: MatchBullet[];
  /** @deprecated Prefer `risks` — kept for existing consumers. */
  mismatch: MatchBullet[];
  /** Classified WHY NOT / potential risks. */
  risks: MatchRisk[];
  /** Actionable validation prompts for the hiring team / talent. */
  whatToValidate: string[];
  recommendedNextStep: RecommendedNextStep;
  nextStepReason: string;
  /** Mutual Role × Human × Motivation reading. */
  mutualSummary: string;
  discoveryTier: DiscoveryTier;
  whatMattersMost: string;
  audience: MatchAudience;
  /**
   * Soft public GitHub finding only. Never folded into Role Fit /
   * MATCH_WEIGHTS. Null when not linked — absence must not hurt score.
   */
  technicalSignal: string | null;
  /**
   * Private salary gap % for risk UI. Never pair with raw amounts.
   * Null when aligned / unknown.
   */
  salaryGapPercent: number | null;
};

export type { GapKind, EvidenceKind, MatchRisk, RecommendedNextStep, DiscoveryTier };

/** Existing engine factors, grouped onto the three PRD axes.
 *  Overall `matchScore` stays `computeMatch().score` — these groups are
 *  display-only averages, not a new weight table. */
export const AXIS_FACTOR_KEYS: Record<MatchAxisId, readonly MatchFactorKey[]> = {
  role: ["careerGoals", "industry", "experience", "skills"],
  company: ["workStyle", "location", "companyStage"],
  motivation: ["motivations"],
};

const AXIS_LABEL: Record<MatchAxisId, string> = {
  role: "Role Fit",
  /** Product + marketing language: human/culture fit, not “company vs company”. */
  company: "Human Fit",
  motivation: "Motivation Fit",
};

const BULLET_LABEL: Record<MatchFactorKey, string> = {
  careerGoals: "Career goals",
  motivations: "Values",
  workStyle: "Work style",
  industry: "Industry",
  experience: "Experience",
  skills: "Skills",
  location: "Location",
  companyStage: "Company stage",
};

function axisScore(factors: MatchFactor[], keys: readonly MatchFactorKey[]): number {
  const group = factors.filter((factor) => keys.includes(factor.key));
  const weightSum = group.reduce((sum, factor) => sum + factor.weight, 0);
  if (weightSum === 0) return 0;
  const earned = group.reduce(
    (sum, factor) => sum + factor.fraction * factor.weight,
    0,
  );
  return Math.round((earned / weightSum) * 100);
}

export function matchStrengthLabel(score: number): string {
  // Single band table shared with score chips / MatchReport (see score-tone).
  return scoreBandLabel(score);
}

/** @deprecated Prefer computeMatchConfidence from intelligence.ts */
export function matchConfidence(
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
): MatchConfidence {
  return computeMatchConfidence([], talent, company).confidence;
}

function compactWords(text: string, maxWords = 8): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

function pairOrSolo(a: string, b: string): string {
  const left = a.trim();
  const right = b.trim();
  if (left && right && left.toLowerCase() === right.toLowerCase()) return left;
  if (left && right) return `${left} vs ${right}`;
  return left || right || "not set";
}

function scanFinding(
  factor: MatchFactor,
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  aligned: boolean,
  audience: MatchAudience,
): string {
  const yours = audience === "talent";
  const sharedValues = overlapCanonical(
    talent?.profile.drives ?? [],
    company?.profile.values ?? [],
  );
  const sharedStyle = overlapCanonical(
    talent?.profile.workStyle ?? [],
    company?.profile.workEnvironment ?? [],
  );
  const stage = company?.profile.companyStage.trim() || "not set";
  const years = talent?.profile.yearsExperience;

  switch (factor.key) {
    case "companyStage":
      return aligned
        ? compactWords(`${stage.toLowerCase()}, matches ${yours ? "your" : "their"} interest`)
        : compactWords(`${stage.toLowerCase()}, not ${yours ? "your" : "their"} stated type`);
    case "industry": {
      const talentIndustry = talent?.profile.industry ?? "";
      const companyIndustry = company?.profile.industry ?? "";
      if (aligned) {
        const same =
          talentIndustry.trim().toLowerCase() ===
          companyIndustry.trim().toLowerCase();
        return compactWords(
          same
            ? `same industry, ${companyIndustry || talentIndustry}`
            : `related industries, ${pairOrSolo(talentIndustry, companyIndustry)}`,
        );
      }
      return compactWords(
        `${pairOrSolo(talentIndustry, companyIndustry)}, no overlap yet`,
      );
    }
    case "workStyle":
      return aligned
        ? compactWords(`${sharedStyle.slice(0, 2).join(", ")} overlap`)
        : sharedStyle.length > 0
          ? compactWords(`${sharedStyle.slice(0, 2).join(", ")}, only partial`)
          : "no shared work style yet";
    case "motivations":
      return aligned
        ? compactWords(`${sharedValues.slice(0, 2).join(", ")} overlap`)
        : sharedValues.length > 0
          ? compactWords(`${sharedValues.slice(0, 2).join(", ")}, only partial`)
          : "no shared values yet";
    case "location": {
      const loc = pairOrSolo(
        talent?.profile.location ?? "",
        company?.profile.location ?? "",
      );
      return aligned
        ? compactWords(`both in ${talent?.profile.location || company?.profile.location}`)
        : compactWords(`${loc}, needs a conversation`);
    }
    case "experience":
      if (years == null) return "years of experience not set";
      return aligned
        ? compactWords(`${years} years, experience matters here`)
        : compactWords(`${years} years, thinner signal here`);
    case "skills": {
      // Prefer engine detail when it carries transferable inference language.
      if (factor.detail.toLowerCase().includes("potentially transferable")) {
        return compactWords(factor.detail, 14);
      }
      const required = (company?.roleRequiredSkills ?? []).filter(Boolean);
      const shared = overlapCanonical(
        talent?.profile.skills ?? [],
        required,
      );
      if (required.length === 0) return "role skills not set yet";
      if (shared.length === 0) return "no shared skills with the role yet";
      return aligned
        ? compactWords(`${shared.slice(0, 2).join(", ")} cover role needs`)
        : compactWords(`${shared.slice(0, 2).join(", ")}, partial skill cover`);
    }
    case "careerGoals": {
      const goal = talent?.careerGoal.trim() ?? "";
      const need = company?.connectingAbout.trim() ?? "";
      if (!goal || !need || factor.verdict === "unknown") return "not enough data yet";
      return aligned
        ? compactWords(`${goal} fits ${need}`)
        : compactWords(`${goal} vs ${need}`);
    }
    default:
      return compactWords(factor.detail);
  }
}

function toBullet(
  factor: MatchFactor,
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  aligned: boolean,
  audience: MatchAudience,
): MatchBullet {
  return {
    key: factor.key,
    label: BULLET_LABEL[factor.key],
    finding: scanFinding(factor, talent, company, aligned, audience),
    evidence: evidenceForFactor(factor),
  };
}

function whyBullets(
  factors: MatchFactor[],
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  audience: MatchAudience,
): MatchBullet[] {
  return factors
    .filter((factor) => factor.verdict === "aligned")
    .sort((a, b) => b.fraction * b.weight - a.fraction * a.weight)
    .slice(0, 5)
    .map((factor) => toBullet(factor, talent, company, true, audience));
}

function mismatchBullets(
  factors: MatchFactor[],
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  audience: MatchAudience,
): MatchBullet[] {
  return factors
    .filter(
      (factor) =>
        factor.verdict === "not-aligned" || factor.verdict === "partial",
    )
    .sort((a, b) => a.fraction - b.fraction)
    .map((factor) => toBullet(factor, talent, company, false, audience));
}

function whatMattersMost(factors: MatchFactor[]): string {
  const aligned = factors.filter((factor) => factor.verdict === "aligned");
  const ranked = [...(aligned.length > 0 ? aligned : factors)].sort(
    (a, b) => b.fraction * b.weight - a.fraction * a.weight,
  );
  const top = ranked[0];
  if (!top) {
    return "Not enough overlap to highlight one signal.";
  }
  return `Strongest signal: ${BULLET_LABEL[top.key].toLowerCase()}`;
}

function emptyIntelligence(audience: MatchAudience) {
  return {
    confidence: "Low" as const,
    confidenceReason:
      audience === "talent"
        ? "Not enough profile data yet to assess confidence."
        : "Not enough profile data yet to assess confidence.",
    risks: [] as MatchRisk[],
    whatToValidate: [
      "Complete both profiles and role requirements before relying on this match.",
    ],
    recommendedNextStep: "Not Enough Information" as const,
    nextStepReason: "Insufficient evidence for a hiring recommendation.",
    mutualSummary: "Mutual fit cannot be assessed yet.",
    discoveryTier: "low_confidence" as const,
  };
}

export function emptyMatchReport(
  audience: MatchAudience,
  overall = 0,
  technicalSignal: string | null = null,
): MatchReport {
  const intel = emptyIntelligence(audience);
  return {
    overall,
    strength: matchStrengthLabel(overall),
    axes: (Object.keys(AXIS_LABEL) as MatchAxisId[]).map((id) => ({
      id,
      label: AXIS_LABEL[id],
      score: 0,
    })),
    confidence: intel.confidence,
    confidenceReason: intel.confidenceReason,
    why: [],
    mismatch: [],
    risks: intel.risks,
    whatToValidate: intel.whatToValidate,
    recommendedNextStep: intel.recommendedNextStep,
    nextStepReason: intel.nextStepReason,
    mutualSummary: intel.mutualSummary,
    discoveryTier: intel.discoveryTier,
    whatMattersMost:
      audience === "talent"
        ? "Complete both profiles to see why this may fit you."
        : "Complete both profiles to see why mingle recommends this person.",
    audience,
    technicalSignal,
    salaryGapPercent: null,
  };
}

function technicalSignalFromTalent(
  talent: TalentMatchInput | null,
): string | null {
  if (!talent?.profile.githubLogin && !talent?.profile.githubUrl) return null;
  return technicalSignalFinding(
    talent.profile.githubLogin,
    talent.profile.githubMeta,
  );
}

export function buildMatchReport(
  result: MatchResult,
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  audience: MatchAudience,
): MatchReport {
  const technicalSignal = technicalSignalFromTalent(talent);
  const gap = salaryGapPercent(
    talent?.salaryExpectation,
    company?.salaryMin,
    company?.salaryMax,
  );
  if (result.factors.length === 0) {
    return {
      ...emptyMatchReport(audience, result.score, technicalSignal),
      salaryGapPercent: gap,
    };
  }

  const axes = (Object.keys(AXIS_LABEL) as MatchAxisId[]).map((id) => ({
    id,
    label: AXIS_LABEL[id],
    score: axisScore(result.factors, AXIS_FACTOR_KEYS[id]),
  }));

  const intel = buildIntelligenceExtras(
    result,
    axes,
    talent,
    company,
    audience,
    gap,
  );

  const mismatch = mismatchBullets(result.factors, talent, company, audience);
  if (gap != null) {
    const already = mismatch.some((b) =>
      /salary|compensation|שכר/i.test(b.label + b.finding),
    );
    if (!already) {
      mismatch.unshift({
        key: "experience",
        label: "Salary",
        finding: `Salary expectations differ by about ${gap}%`,
        evidence: "fact",
      });
    } else {
      for (const bullet of mismatch) {
        if (/salary|compensation|שכר/i.test(bullet.label + bullet.finding)) {
          bullet.finding = `Salary gap of about ${gap}%`;
          bullet.label = "Salary";
          bullet.evidence = "fact";
        }
      }
    }
  }

  return {
    overall: result.score,
    strength: matchStrengthLabel(result.score),
    axes,
    confidence: intel.confidence,
    confidenceReason: intel.confidenceReason,
    why: whyBullets(result.factors, talent, company, audience),
    mismatch,
    risks: intel.risks,
    whatToValidate: intel.whatToValidate,
    recommendedNextStep: intel.recommendedNextStep,
    nextStepReason: intel.nextStepReason,
    mutualSummary: intel.mutualSummary,
    discoveryTier: intel.discoveryTier,
    whatMattersMost: whatMattersMost(result.factors),
    audience,
    // Soft signal only — not included in AXIS_FACTOR_KEYS / MATCH_WEIGHTS.
    technicalSignal,
    salaryGapPercent: gap,
  };
}
