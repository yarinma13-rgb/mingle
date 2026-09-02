import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";

// Deterministic weighted matching engine (PRODUCT_SPEC.md section 31,
// weights overridden per explicit product decision — see below). No AI
// model required for MVP; replaceable later by ML/AI per spec.
//
// Weights (sum to 100), overriding the spec's original example set:
export const MATCH_WEIGHTS = {
  careerGoals: 20,
  motivations: 20,
  workStyle: 18,
  industry: 14,
  experience: 13,
  location: 8,
  companyStage: 7,
} as const;

export type MatchFactorKey = keyof typeof MATCH_WEIGHTS;

export type MatchVerdict = "aligned" | "partial" | "not-aligned" | "unknown";

export type MatchFactor = {
  key: MatchFactorKey;
  label: string;
  weight: number;
  fraction: number; // 0 to 1, how much of this factor's weight was earned
  verdict: MatchVerdict;
  detail: string;
};

export type MatchResult = {
  score: number; // 0 to 100
  factors: MatchFactor[];
};

export type TalentMatchInput = {
  profile: ProfileState;
  careerGoal: string;
  companyTypes: string[];
};

export type CompanyMatchInput = {
  profile: CompanyProfileState;
  connectingAbout: string;
  culturePriorities: string[];
};

function overlapFraction(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const bLower = new Set(b.map((item) => item.toLowerCase()));
  const shared = a.filter((item) => bLower.has(item.toLowerCase())).length;
  return shared / Math.max(a.length, b.length);
}

function sharedItems(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => bLower.has(item.toLowerCase()));
}

function verdictFromFraction(fraction: number): MatchVerdict {
  if (fraction >= 0.6) return "aligned";
  if (fraction >= 0.3) return "partial";
  return "not-aligned";
}

// How "committed to a hire, right now" each option signals — used to
// compare talent's stated career goal against what the company is
// looking to connect about, since neither side has a field that
// directly maps to the other.
const TALENT_COMMITMENT: Record<string, number> = {
  "Full time opportunity": 1,
  "Part time opportunity": 0.7,
  "Freelance or contract": 0.6,
  "Open to conversations": 0.35,
  "Exploring what's next": 0.25,
};

const COMPANY_COMMITMENT: Record<string, number> = {
  Hiring: 1,
  "Future hiring": 0.6,
  "Talent discovery": 0.4,
  "Building a talent community": 0.3,
  "Exploring partnerships": 0.3,
  Networking: 0.2,
};

// Talent's stated company-type interest, mapped to the company stage
// options it should be treated as compatible with.
const COMPANY_TYPE_TO_STAGES: Record<string, string[]> = {
  Startup: ["Pre seed", "Seed", "Early stage"],
  "Scale up": ["Growth", "Scale up"],
  "Established company": ["Established"],
  Enterprise: ["Established"],
};

function careerGoalsFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const t = TALENT_COMMITMENT[talent.careerGoal];
  const c = COMPANY_COMMITMENT[company.connectingAbout];
  const fraction =
    t === undefined || c === undefined ? 0.5 : 1 - Math.abs(t - c);
  const verdict = verdictFromFraction(fraction);
  const detail =
    t === undefined || c === undefined
      ? "Not enough onboarding data to compare career goals yet."
      : verdict === "aligned"
        ? `${talent.careerGoal} lines up well with what they're looking to connect about (${company.connectingAbout.toLowerCase()}).`
        : verdict === "partial"
          ? `${talent.careerGoal} is a partial fit with ${company.connectingAbout.toLowerCase()}.`
          : `${talent.careerGoal} doesn't line up closely with ${company.connectingAbout.toLowerCase()} right now.`;
  return {
    key: "careerGoals",
    label: "Career goals",
    weight: MATCH_WEIGHTS.careerGoals,
    fraction,
    verdict,
    detail,
  };
}

function motivationsFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const fraction = overlapFraction(
    talent.profile.drives,
    company.profile.values,
  );
  const shared = sharedItems(talent.profile.drives, company.profile.values);
  const verdict = verdictFromFraction(fraction);
  const detail =
    shared.length > 0
      ? `Shares ${shared.length} of what drives them with what the company values: ${shared.join(", ")}.`
      : "No overlap yet between what drives them and what the company says it values.";
  return {
    key: "motivations",
    label: "Motivations and values",
    weight: MATCH_WEIGHTS.motivations,
    fraction,
    verdict,
    detail,
  };
}

function workStyleFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const fraction = overlapFraction(
    talent.profile.workStyle,
    company.profile.workEnvironment,
  );
  const shared = sharedItems(
    talent.profile.workStyle,
    company.profile.workEnvironment,
  );
  const verdict = verdictFromFraction(fraction);
  const detail =
    shared.length > 0
      ? `Compatible on how they work: ${shared.join(", ")}.`
      : "Their work style and the company's day to day don't overlap yet.";
  return {
    key: "workStyle",
    label: "Work style",
    weight: MATCH_WEIGHTS.workStyle,
    fraction,
    verdict,
    detail,
  };
}

function industryFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const t = talent.profile.industry.trim().toLowerCase();
  const c = company.profile.industry.trim().toLowerCase();
  const fraction = !t || !c ? 0 : t === c ? 1 : 0;
  const verdict = verdictFromFraction(fraction);
  const detail =
    !t || !c
      ? "Industry isn't set on one side yet."
      : t === c
        ? `Same industry — ${company.profile.industry}.`
        : `Different industries — ${talent.profile.industry || "not set"} vs ${company.profile.industry}.`;
  return {
    key: "industry",
    label: "Industry",
    weight: MATCH_WEIGHTS.industry,
    fraction,
    verdict,
    detail,
  };
}

function experienceFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const years = talent.profile.yearsExperience;
  const cares = company.culturePriorities.includes("Experience");

  if (years === null) {
    return {
      key: "experience",
      label: "Experience",
      weight: MATCH_WEIGHTS.experience,
      fraction: 0.5,
      verdict: "unknown",
      detail: "Years of experience isn't set on their profile yet.",
    };
  }

  if (!cares) {
    return {
      key: "experience",
      label: "Experience",
      weight: MATCH_WEIGHTS.experience,
      fraction: 0.6,
      verdict: "unknown",
      detail:
        "The company didn't flag experience as a top priority, so this is a neutral signal rather than a real comparison.",
    };
  }

  // Company explicitly said experience matters to them — reward more
  // years, capping out around a decade of experience.
  const fraction = Math.min(1, years / 10);
  const verdict = verdictFromFraction(fraction);
  const detail =
    verdict === "aligned"
      ? `${years} years of experience, and the company said experience matters to them.`
      : `${years} years of experience — the company said experience matters to them, so this counts for less than a deeper track record would.`;
  return {
    key: "experience",
    label: "Experience",
    weight: MATCH_WEIGHTS.experience,
    fraction,
    verdict,
    detail,
  };
}

function locationFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const t = talent.profile.location.trim().toLowerCase();
  const c = company.profile.location.trim().toLowerCase();
  const remoteFriendly = company.profile.workEnvironment.some((item) =>
    item.toLowerCase().includes("remote"),
  );
  const fraction = !t || !c ? 0.3 : t === c ? 1 : remoteFriendly ? 0.5 : 0.2;
  const verdict = verdictFromFraction(fraction);
  const detail =
    !t || !c
      ? "Location isn't set on one side yet."
      : t === c
        ? `Both based in ${company.profile.location}.`
        : remoteFriendly
          ? `Different locations (${talent.profile.location} vs ${company.profile.location}), but the company works remote friendly.`
          : `Different locations — ${talent.profile.location || "not set"} vs ${company.profile.location}.`;
  return {
    key: "location",
    label: "Location",
    weight: MATCH_WEIGHTS.location,
    fraction,
    verdict,
    detail,
  };
}

function companyStageFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  if (talent.companyTypes.length === 0 || !company.profile.companyStage) {
    return {
      key: "companyStage",
      label: "Company stage",
      weight: MATCH_WEIGHTS.companyStage,
      fraction: 0.5,
      verdict: "unknown",
      detail: "Company stage preference isn't set on one side yet.",
    };
  }

  if (talent.companyTypes.includes("Open to anything")) {
    return {
      key: "companyStage",
      label: "Company stage",
      weight: MATCH_WEIGHTS.companyStage,
      fraction: 1,
      verdict: "aligned",
      detail: `Open to any company stage, including ${company.profile.companyStage}.`,
    };
  }

  const matches = talent.companyTypes.some((type) =>
    (COMPANY_TYPE_TO_STAGES[type] ?? []).includes(company.profile.companyStage),
  );
  const fraction = matches ? 1 : 0.15;
  const verdict = verdictFromFraction(fraction);
  const detail = matches
    ? `Interested in ${talent.companyTypes.join(", ").toLowerCase()} companies, and this one is ${company.profile.companyStage.toLowerCase()}.`
    : `Looking for ${talent.companyTypes.join(", ").toLowerCase()} companies, but this one is ${company.profile.companyStage.toLowerCase()}.`;
  return {
    key: "companyStage",
    label: "Company stage",
    weight: MATCH_WEIGHTS.companyStage,
    fraction,
    verdict,
    detail,
  };
}

/**
 * Computes a deterministic weighted match score between one talent
 * profile and one company profile, plus a full transparent breakdown of
 * every factor — including ones that didn't align, not just the ones
 * that did. Every profile gets a real score; nothing is hard-filtered
 * out for low overlap.
 */
export function computeMatch(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchResult {
  const factors = [
    careerGoalsFactor(talent, company),
    motivationsFactor(talent, company),
    workStyleFactor(talent, company),
    industryFactor(talent, company),
    experienceFactor(talent, company),
    locationFactor(talent, company),
    companyStageFactor(talent, company),
  ];

  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.fraction * factor.weight, 0),
  );

  return { score: Math.min(100, Math.max(0, score)), factors };
}
