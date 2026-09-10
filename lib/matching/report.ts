import { profileCompletion } from "@/lib/profile/persistence";
import { companyProfileCompletion } from "@/lib/company-profile/persistence";
import { overlapCanonical } from "@/lib/matching/synonyms";
import type {
  MatchFactor,
  MatchFactorKey,
  MatchResult,
  TalentMatchInput,
  CompanyMatchInput,
} from "@/lib/matching/engine";

export type MatchAudience = "company" | "talent";
export type MatchConfidence = "High" | "Medium" | "Low";

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
};

export type MatchReport = {
  overall: number;
  strength: string;
  axes: MatchAxisScore[];
  confidence: MatchConfidence;
  why: MatchBullet[];
  mismatch: MatchBullet[];
  whatMattersMost: string;
  audience: MatchAudience;
};

/** Existing engine factors, grouped onto the three PRD axes.
 *  Overall `matchScore` stays `computeMatch().score` — these groups are
 *  display-only averages, not a new weight table. */
export const AXIS_FACTOR_KEYS: Record<MatchAxisId, readonly MatchFactorKey[]> = {
  role: ["careerGoals", "industry", "experience"],
  company: ["workStyle", "location", "companyStage"],
  motivation: ["motivations"],
};

const AXIS_LABEL: Record<MatchAxisId, string> = {
  role: "Role Fit",
  company: "Company Fit",
  motivation: "Motivation Fit",
};

const BULLET_LABEL: Record<MatchFactorKey, string> = {
  careerGoals: "Career goals",
  motivations: "Values",
  workStyle: "Work style",
  industry: "Industry",
  experience: "Experience",
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
  if (score >= 80) return "Strong Match";
  if (score >= 65) return "Good Match";
  return "Worth a look";
}

export function matchConfidence(
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
): MatchConfidence {
  const talentPct = talent ? profileCompletion(talent.profile) : 0;
  const companyPct = company ? companyProfileCompletion(company.profile) : 0;
  const prefBits = [
    Boolean(talent?.careerGoal),
    (talent?.companyTypes.length ?? 0) > 0,
    Boolean(company?.connectingAbout),
    (company?.culturePriorities.length ?? 0) > 0,
  ];
  const prefPct = Math.round(
    (prefBits.filter(Boolean).length / prefBits.length) * 100,
  );
  const completeness = (talentPct + companyPct + prefPct) / 3;
  if (completeness >= 80) return "High";
  if (completeness >= 55) return "Medium";
  return "Low";
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
    case "industry":
      return aligned
        ? compactWords(`same industry, ${company?.profile.industry || talent?.profile.industry}`)
        : compactWords(
            `${pairOrSolo(talent?.profile.industry ?? "", company?.profile.industry ?? "")}, no overlap yet`,
          );
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

function whatMattersMost(
  factors: MatchFactor[],
  audience: MatchAudience,
): string {
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

export function emptyMatchReport(
  audience: MatchAudience,
  overall = 0,
): MatchReport {
  return {
    overall,
    strength: matchStrengthLabel(overall),
    axes: (Object.keys(AXIS_LABEL) as MatchAxisId[]).map((id) => ({
      id,
      label: AXIS_LABEL[id],
      score: 0,
    })),
    confidence: "Low",
    why: [],
    mismatch: [],
    whatMattersMost:
      audience === "talent"
        ? "Complete both profiles to see why this may fit you."
        : "Complete both profiles to see why mingle recommends this person.",
    audience,
  };
}

export function buildMatchReport(
  result: MatchResult,
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  audience: MatchAudience,
): MatchReport {
  if (result.factors.length === 0) {
    return emptyMatchReport(audience, result.score);
  }
  return {
    overall: result.score,
    strength: matchStrengthLabel(result.score),
    axes: (Object.keys(AXIS_LABEL) as MatchAxisId[]).map((id) => ({
      id,
      label: AXIS_LABEL[id],
      score: axisScore(result.factors, AXIS_FACTOR_KEYS[id]),
    })),
    confidence: matchConfidence(talent, company),
    why: whyBullets(result.factors, talent, company, audience),
    mismatch: mismatchBullets(result.factors, talent, company, audience),
    whatMattersMost: whatMattersMost(result.factors, audience),
    audience,
  };
}
