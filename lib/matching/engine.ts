import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import { overlapCanonical } from "@/lib/matching/synonyms";
import { skillCoverageWithAdjacency } from "@/lib/matching/skill-adjacency";
import { applySalaryNudge } from "@/lib/matching/salary-nudge";
import { applyTargetRoleNudge } from "@/lib/matching/target-role-nudge";

// Deterministic weighted matching engine (PRODUCT_SPEC.md section 31,
// weights overridden per explicit product decision — see below). No AI
// model required for MVP; replaceable later by ML/AI per spec.
//
// Weights (sum to 100), overriding the spec's original example set:
export const MATCH_WEIGHTS = {
  careerGoals: 17,
  motivations: 17,
  workStyle: 15,
  industry: 12,
  experience: 11,
  skills: 16,
  location: 7,
  companyStage: 5,
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
  /** Optional private monthly expectation (ILS). Soft score nudge only. */
  salaryExpectation?: number | null;
};

export type CompanyMatchInput = {
  profile: CompanyProfileState;
  connectingAbout: string;
  culturePriorities: string[];
  /** Optional private role/company budget (ILS). Soft score nudge only. */
  salaryMin?: number | null;
  salaryMax?: number | null;
  /** Optional open role title / department for soft target-role boost. */
  roleTitle?: string | null;
  roleDepartment?: string | null;
  /** Required skills from an open role — primary skills signal for Role Fit. */
  roleRequiredSkills?: string[] | null;
};

function overlapFraction(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const shared = overlapCanonical(a, b).length;
  return shared / Math.max(a.length, b.length);
}

function sharedItems(a: string[], b: string[]): string[] {
  return overlapCanonical(a, b);
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
  // Current company onboarding labels
  "Hiring now": 1,
  "Hiring soon": 0.65,
  "Building a talent pipeline": 0.4,
  "Exploring the market": 0.3,
  "Networking with talent": 0.2,
  // Legacy rows already saved in preferences
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

/** Soft industry compare: exact → contains → shared token → domain family → miss. */
function industryOverlapFraction(a: string, b: string): number {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.72;
  const tokens = (value: string) =>
    value
      .split(/[\s/&,+\-_|]+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 2);
  const leftTokens = new Set(tokens(left));
  if (tokens(right).some((token) => leftTokens.has(token))) return 0.55;

  // Adjacent domain families — inference only (never treated as equivalence).
  const FAMILIES = [
    ["saas", "b2b", "software", "fintech", "insurtech", "marketplace", "tech"],
    ["health", "healthcare", "healthtech", "medtech", "biotech"],
    ["ecommerce", "retail", "consumer", "d2c"],
  ];
  const inFamily = (value: string, family: string[]) =>
    family.some((token) => value.includes(token));
  for (const family of FAMILIES) {
    if (inFamily(left, family) && inFamily(right, family)) return 0.5;
  }
  return 0;
}

function industryFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const t = talent.profile.industry.trim();
  const c = company.profile.industry.trim();
  const fraction = industryOverlapFraction(t, c);
  const verdict = verdictFromFraction(fraction);
  const detail =
    !t || !c
      ? "Industry isn't set on one side yet."
      : fraction >= 1
        ? `Same industry — ${c}.`
        : fraction >= 0.55
          ? `Related industries — ${t} and ${c}.`
          : fraction >= 0.45
            ? `Potentially transferable industry context (inference, not equivalence) — ${t} and ${c}.`
            : `Different industries — ${t || "not set"} vs ${c}.`;
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


function skillsFactor(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchFactor {
  const talentSkills = talent.profile.skills;
  const required = (company.roleRequiredSkills ?? [])
    .map((item) => item.trim())
    .filter(Boolean);

  if (required.length === 0) {
    return {
      key: "skills",
      label: "Skills",
      weight: MATCH_WEIGHTS.skills,
      fraction: 0.55,
      verdict: "unknown",
      detail:
        "No role-required skills yet, so this stays a neutral Role Fit signal.",
    };
  }

  if (talentSkills.length === 0) {
    return {
      key: "skills",
      label: "Skills",
      weight: MATCH_WEIGHTS.skills,
      fraction: 0.15,
      verdict: "not-aligned",
      detail:
        "Required skills are set on the role, but their profile doesn't list skills yet.",
    };
  }

  const { exact, adjacent, fraction } = skillCoverageWithAdjacency(
    talentSkills,
    required,
  );
  const verdict = verdictFromFraction(fraction);
  const preview = exact.slice(0, 3).join(", ");
  const adjacentPreview = adjacent
    .slice(0, 2)
    .map((hit) => `${hit.talentSkill} → ${hit.required}`)
    .join("; ");

  let detail: string;
  if (exact.length === 0 && adjacent.length === 0) {
    detail = `Little overlap with the role's required skills (${required.slice(0, 3).join(", ")}${required.length > 3 ? "…" : ""}).`;
  } else if (exact.length === 0 && adjacent.length > 0) {
    detail = `Potentially transferable skill overlap (inference, not equivalence): ${adjacentPreview}.`;
  } else if (adjacent.length > 0) {
    detail =
      verdict === "aligned"
        ? `Covers ${exact.length} of ${required.length} required skills${preview ? `: ${preview}` : ""}. Potentially transferable additions: ${adjacentPreview}.`
        : `Partial skill coverage — ${exact.length} of ${required.length} required${preview ? ` (${preview})` : ""}. Potentially transferable: ${adjacentPreview}.`;
  } else {
    detail =
      verdict === "aligned"
        ? `Covers ${exact.length} of ${required.length} required skills${preview ? `: ${preview}` : ""}.`
        : `Partial skill coverage — ${exact.length} of ${required.length} required${preview ? ` (${preview})` : ""}.`;
  }

  return {
    key: "skills",
    label: "Skills",
    weight: MATCH_WEIGHTS.skills,
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

const MATCH_CACHE = new Map<string, MatchResult>();
const MATCH_CACHE_LIMIT = 200;

function matchCacheKey(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): string {
  return JSON.stringify([
    talent.careerGoal,
    talent.companyTypes,
    talent.profile,
    talent.salaryExpectation ?? null,
    company.connectingAbout,
    company.culturePriorities,
    company.profile,
    company.salaryMin ?? null,
    company.salaryMax ?? null,
    company.roleTitle ?? null,
    company.roleDepartment ?? null,
    company.roleRequiredSkills ?? null,
  ]);
}

function computeMatchUncached(
  talent: TalentMatchInput,
  company: CompanyMatchInput,
): MatchResult {
  const factors = [
    careerGoalsFactor(talent, company),
    motivationsFactor(talent, company),
    workStyleFactor(talent, company),
    industryFactor(talent, company),
    experienceFactor(talent, company),
    skillsFactor(talent, company),
    locationFactor(talent, company),
    companyStageFactor(talent, company),
  ];

  const base = Math.round(
    factors.reduce((sum, factor) => sum + factor.fraction * factor.weight, 0),
  );
  const { score: salaryScore } = applySalaryNudge(
    base,
    talent.salaryExpectation,
    company.salaryMin,
    company.salaryMax,
  );
  const { score } = applyTargetRoleNudge(salaryScore, talent.profile.targetRole, [
    company.roleTitle,
    company.roleDepartment,
    ...company.profile.lookingFor,
    company.profile.industry,
  ]);

  return { score, factors };
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
  const key = matchCacheKey(talent, company);
  const cached = MATCH_CACHE.get(key);
  if (cached) return cached;
  const result = computeMatchUncached(talent, company);
  if (MATCH_CACHE.size >= MATCH_CACHE_LIMIT) {
    const oldest = MATCH_CACHE.keys().next().value;
    if (oldest !== undefined) MATCH_CACHE.delete(oldest);
  }
  MATCH_CACHE.set(key, result);
  return result;
}
