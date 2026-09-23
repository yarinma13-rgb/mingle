/**
 * Recruiting intelligence helpers layered on top of the deterministic
 * match engine. Explains confidence, classifies gaps, suggests what to
 * validate, and recommends a human next step — without inventing data.
 */

import type {
  MatchFactor,
  MatchFactorKey,
  MatchResult,
  TalentMatchInput,
  CompanyMatchInput,
} from "@/lib/matching/engine";
import { profileCompletion } from "@/lib/profile/persistence";
import { companyProfileCompletion } from "@/lib/company-profile/persistence";

export type MatchConfidence = "High" | "Medium" | "Low";
export type MatchAudience = "company" | "talent";

type AxisScore = { id: string; score: number };

export type GapKind = "hard" | "development" | "preference" | "unknown";
export type EvidenceKind = "fact" | "inference" | "unknown";

export type MatchRisk = {
  key: MatchFactorKey | "salary" | "mutual";
  label: string;
  finding: string;
  gapKind: GapKind;
  evidence: EvidenceKind;
};

export type RecommendedNextStep =
  | "HR Interview"
  | "Hiring Manager Interview"
  | "Team Conversation"
  | "Request More Information"
  | "Validate Key Risk"
  | "Hold"
  | "Not Enough Information";

export type DiscoveryTier =
  | "strong"
  | "potential"
  | "development"
  | "low_confidence";

export type IntelligenceExtras = {
  confidence: MatchConfidence;
  confidenceReason: string;
  risks: MatchRisk[];
  whatToValidate: string[];
  recommendedNextStep: RecommendedNextStep;
  nextStepReason: string;
  mutualSummary: string;
  discoveryTier: DiscoveryTier;
};

const FACTOR_LABEL: Record<MatchFactorKey, string> = {
  careerGoals: "Career goals",
  motivations: "Values",
  workStyle: "Work style",
  industry: "Industry",
  experience: "Experience",
  skills: "Skills",
  location: "Location",
  companyStage: "Company stage",
};

/** Classify a weak/partial/unknown factor into a transparent gap kind. */
export function classifyGap(factor: MatchFactor): GapKind {
  if (factor.verdict === "unknown") return "unknown";

  switch (factor.key) {
    case "skills":
      if (factor.verdict === "not-aligned") return "hard";
      return "development";
    case "experience":
      return factor.verdict === "not-aligned" ? "development" : "development";
    case "industry":
      return factor.verdict === "not-aligned" ? "development" : "preference";
    case "location":
    case "workStyle":
    case "companyStage":
    case "careerGoals":
    case "motivations":
      return "preference";
    default:
      return "preference";
  }
}

export function evidenceForFactor(factor: MatchFactor): EvidenceKind {
  if (factor.verdict === "unknown") return "unknown";
  if (factor.detail.toLowerCase().includes("potentially transferable")) {
    return "inference";
  }
  if (factor.detail.toLowerCase().includes("related industr")) {
    return "inference";
  }
  return "fact";
}

function missingCriticalSignals(
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
): string[] {
  const missing: string[] = [];
  if (!talent) {
    missing.push("candidate profile");
    return missing;
  }
  if (!company) {
    missing.push("company profile");
    return missing;
  }
  if (talent.profile.skills.length === 0) missing.push("candidate skills");
  if (!(company.roleRequiredSkills?.length)) missing.push("role required skills");
  if (!talent.careerGoal.trim()) missing.push("career goals");
  if (!company.connectingAbout.trim()) missing.push("hiring intent");
  if (talent.profile.drives.length === 0) missing.push("candidate motivations");
  if (company.profile.values.length === 0) missing.push("company values");
  if (!talent.profile.workStyle.length) missing.push("work style");
  if (!company.profile.workEnvironment.length) missing.push("work environment");
  return missing;
}

/**
 * Confidence = how reliable the assessment is (not how strong the match is).
 * Combines profile completeness with factor coverage and critical gaps.
 */
export function computeMatchConfidence(
  factors: MatchFactor[],
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
): { confidence: MatchConfidence; reason: string } {
  const talentPct = talent ? profileCompletion(talent.profile) : 0;
  const companyPct = company ? companyProfileCompletion(company.profile) : 0;
  const prefBits = [
    Boolean(talent?.careerGoal),
    (talent?.companyTypes.length ?? 0) > 0,
    Boolean(company?.connectingAbout),
    (company?.culturePriorities.length ?? 0) > 0,
    (company?.roleRequiredSkills?.length ?? 0) > 0,
    (talent?.profile.skills.length ?? 0) > 0,
  ];
  const prefPct = Math.round(
    (prefBits.filter(Boolean).length / prefBits.length) * 100,
  );

  const unknownWeight = factors
    .filter((f) => f.verdict === "unknown")
    .reduce((sum, f) => sum + f.weight, 0);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0) || 100;
  const unknownRatio = unknownWeight / totalWeight;

  const missing = missingCriticalSignals(talent, company);
  let score = (talentPct + companyPct + prefPct) / 3;
  score -= unknownRatio * 35;
  score -= Math.min(25, missing.length * 6);

  let confidence: MatchConfidence;
  if (score >= 72 && missing.length <= 1 && unknownRatio < 0.25) {
    confidence = "High";
  } else if (score >= 48) {
    confidence = "Medium";
  } else {
    confidence = "Low";
  }

  const reasonParts: string[] = [];
  if (missing.length > 0) {
    reasonParts.push(`Missing: ${missing.slice(0, 3).join(", ")}`);
  }
  if (unknownRatio >= 0.2) {
    reasonParts.push(
      `${Math.round(unknownRatio * 100)}% of weighted signals are still unknown`,
    );
  }
  if (reasonParts.length === 0) {
    reasonParts.push(
      confidence === "High"
        ? "Core role, human, and motivation signals are sufficiently populated."
        : "Some signals remain thin — treat the score as directional.",
    );
  }

  return { confidence, reason: reasonParts.join(". ").replace(/\.\s*\./g, ".") };
}

export function buildRisks(
  factors: MatchFactor[],
  salaryGap: number | null,
  audience: MatchAudience,
): MatchRisk[] {
  const risks: MatchRisk[] = factors
    .filter(
      (f) =>
        f.verdict === "not-aligned" ||
        f.verdict === "partial" ||
        f.verdict === "unknown",
    )
    .sort((a, b) => {
      const rank = (v: MatchFactor["verdict"]) =>
        v === "not-aligned" ? 0 : v === "partial" ? 1 : 2;
      return rank(a.verdict) - rank(b.verdict) || a.fraction - b.fraction;
    })
    .map((factor) => ({
      key: factor.key,
      label: FACTOR_LABEL[factor.key],
      finding:
        factor.verdict === "unknown"
          ? audience === "talent"
            ? `${FACTOR_LABEL[factor.key]} not yet validated for this opportunity.`
            : `${FACTOR_LABEL[factor.key]} has not yet been sufficiently validated.`
          : factor.detail,
      gapKind: classifyGap(factor),
      evidence: evidenceForFactor(factor),
    }));

  if (salaryGap != null) {
    risks.unshift({
      key: "salary",
      label: "Compensation",
      finding: `Compensation expectations differ by about ${salaryGap}%.`,
      gapKind: "preference",
      evidence: "fact",
    });
  }

  return risks;
}

export function buildWhatToValidate(
  risks: MatchRisk[],
  factors: MatchFactor[],
  audience: MatchAudience,
): string[] {
  const prompts: string[] = [];
  const seen = new Set<string>();

  const push = (text: string) => {
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    prompts.push(text);
  };

  for (const risk of risks) {
    switch (risk.key) {
      case "skills":
        push(
          audience === "talent"
            ? "Confirm which role skills you already use day-to-day vs. which you would ramp into."
            : "Validate depth on the critical required skills in a technical screen.",
        );
        break;
      case "experience":
        push("Explore years and scope of experience against the role’s real bar.");
        break;
      case "location":
        push("Confirm work-model and location expectations (remote / hybrid / office).");
        break;
      case "workStyle":
        push("Discuss day-to-day collaboration and communication preferences.");
        break;
      case "motivations":
        push(
          audience === "talent"
            ? "Clarify whether this company’s values match what drives you next."
            : "Clarify what motivates this candidate to move, and whether it aligns here.",
        );
        break;
      case "careerGoals":
        push("Explore expected career progression over the next 12–18 months.");
        break;
      case "companyStage":
        push("Validate comfort with this company stage and pace.");
        break;
      case "industry":
        push("Explore whether adjacent industry experience transfers to this domain.");
        break;
      case "salary":
        push("Confirm compensation expectations early, without sharing private numbers.");
        break;
      default:
        break;
    }
  }

  const unknownSkills = factors.find(
    (f) => f.key === "skills" && f.verdict === "unknown",
  );
  if (unknownSkills) {
    push("Define must-have vs preferred skills for this role before ranking further.");
  }

  return prompts.slice(0, 5);
}

export function buildMutualSummary(
  axes: AxisScore[],
  overall: number,
): string {
  const role = axes.find((a) => a.id === "role")?.score ?? 0;
  const human = axes.find((a) => a.id === "company")?.score ?? 0;
  const motivation = axes.find((a) => a.id === "motivation")?.score ?? 0;

  if (overall >= 80 && human >= 75 && motivation >= 75) {
    return "Mutual alignment looks strong across role, human, and motivation fit.";
  }
  if (role >= 70 && motivation < 65) {
    return "Strong professional fit, but potential motivation or expectation mismatch.";
  }
  if (role >= 70 && human < 65) {
    return "Strong role fit, with open questions on human / environment fit.";
  }
  if (motivation >= 70 && role < 65) {
    return "Motivation aligns, but role capability still needs validation.";
  }
  if (role >= 75 && human >= 75 && motivation >= 75) {
    return "Mutual alignment looks strong across role, human, and motivation fit.";
  }
  if (overall < 45) {
    return "Mutual fit is limited on current evidence — treat as exploratory.";
  }
  return "Mixed mutual fit — review Role, Human, and Motivation Fit before deciding.";
}

export function recommendNextStep(
  overall: number,
  confidence: MatchConfidence,
  risks: MatchRisk[],
  motivationScore?: number,
): { step: RecommendedNextStep; reason: string } {
  const hard = risks.filter((r) => r.gapKind === "hard");
  const unknowns = risks.filter((r) => r.gapKind === "unknown");
  const motivationRisk = risks.some(
    (r) => r.key === "motivations" || r.key === "careerGoals",
  );

  if (confidence === "Low" || unknowns.length >= 3) {
    return {
      step: "Request More Information",
      reason:
        "Too many signals are unknown for a reliable recommendation — fill critical gaps first.",
    };
  }

  if (hard.length >= 2 && overall < 70) {
    return {
      step: "Hold",
      reason: "Multiple hard gaps on current evidence — pause until risks are addressed.",
    };
  }

  if (
    (motivationScore != null && motivationScore < 40) ||
    (motivationRisk && overall >= 70)
  ) {
    return {
      step: "Validate Key Risk",
      reason:
        "Professional fit may be strong, but motivation / expectation alignment needs validation first.",
    };
  }

  if (hard.length > 0 || risks.some((r) => r.key === "salary")) {
    return {
      step: "Validate Key Risk",
      reason: "Notable gaps should be validated before investing interview time.",
    };
  }

  if (overall >= 80 && confidence === "High") {
    return {
      step: "Hiring Manager Interview",
      reason: "Strong, well-evidenced mutual fit — ready for hiring-manager depth.",
    };
  }

  if (overall >= 65) {
    return {
      step: "HR Interview",
      reason: "Enough signal to start a structured conversation and validate open risks.",
    };
  }

  if (overall >= 50) {
    return {
      step: "Team Conversation",
      reason: "Exploratory mutual interest — a lighter conversation can clarify fit.",
    };
  }

  return {
    step: "Not Enough Information",
    reason: "Current evidence does not support a confident next hiring step.",
  };
}

export function discoveryTierFor(
  overall: number,
  confidence: MatchConfidence,
  risks: MatchRisk[],
  hasTransferableSkills: boolean,
  motivationScore?: number,
): DiscoveryTier {
  const hard = risks.filter((r) => r.gapKind === "hard").length;
  if (confidence === "Low") return "low_confidence";
  if (
    overall >= 75 &&
    hard === 0 &&
    (motivationScore == null || motivationScore >= 55)
  ) {
    return "strong";
  }
  if (hasTransferableSkills && overall >= 55) return "potential";
  if (overall >= 50 && hard <= 1) return "development";
  if (overall >= 60) return "potential";
  return "low_confidence";
}

export function buildIntelligenceExtras(
  result: MatchResult,
  axes: AxisScore[],
  talent: TalentMatchInput | null,
  company: CompanyMatchInput | null,
  audience: MatchAudience,
  salaryGap: number | null,
): IntelligenceExtras {
  const { confidence, reason: confidenceReason } = computeMatchConfidence(
    result.factors,
    talent,
    company,
  );
  const risks = buildRisks(result.factors, salaryGap, audience);
  const whatToValidate = buildWhatToValidate(risks, result.factors, audience);
  const motivationAxis = axes.find((a) => a.id === "motivation")?.score;
  const { step, reason: nextStepReason } = recommendNextStep(
    result.score,
    confidence,
    risks,
    motivationAxis,
  );
  const hasTransferable = result.factors.some(
    (f) =>
      f.key === "skills" &&
      f.detail.toLowerCase().includes("potentially transferable"),
  );

  return {
    confidence,
    confidenceReason,
    risks,
    whatToValidate,
    recommendedNextStep: step,
    nextStepReason,
    mutualSummary: buildMutualSummary(axes, result.score),
    discoveryTier: discoveryTierFor(
      result.score,
      confidence,
      risks,
      hasTransferable,
      motivationAxis,
    ),
  };
}
