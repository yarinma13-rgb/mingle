import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";

function overlap(a: string[], b: string[]): string[] {
  const bLower = new Set(b.map((item) => item.toLowerCase()));
  return a.filter((item) => bLower.has(item.toLowerCase()));
}

/**
 * Lightweight, deterministic overlap scoring between a talent and a
 * company profile — a stand in for the weighted matching engine spec'd
 * for the discovery phase (not yet built). Kept simple on purpose: this
 * only needs to power the profile detail screen's "why this could be a
 * match" section for Phase 4, and is fully replaceable later.
 */
export function whyMatchReasons(
  talent: ProfileState,
  company: CompanyProfileState,
): string[] {
  const reasons: string[] = [];

  const sharedWorkStyle = overlap(talent.workStyle, company.workEnvironment);
  if (sharedWorkStyle.length > 0) {
    reasons.push(
      `You both work ${sharedWorkStyle[0].toLowerCase()} — that's how they run day to day too.`,
    );
  }

  const sharedValues = overlap(talent.drives, company.values);
  if (sharedValues.length > 0) {
    reasons.push(
      `${sharedValues[0]} matters to you, and it's one of the things they value most.`,
    );
  }

  const sharedLookingFor = overlap(talent.lookingFor, company.lookingFor);
  if (sharedLookingFor.length > 0) {
    reasons.push(`They're hiring for exactly what you're looking for.`);
  }

  if (
    talent.industry &&
    company.industry &&
    talent.industry.toLowerCase() === company.industry.toLowerCase()
  ) {
    reasons.push(`Same industry — ${company.industry}.`);
  }

  if (
    talent.location &&
    company.location &&
    talent.location.toLowerCase() === company.location.toLowerCase()
  ) {
    reasons.push(`You're both based in ${company.location}.`);
  }

  if (reasons.length === 0) {
    reasons.push("A fresh connection — no shared history yet, just potential.");
  }

  return reasons.slice(0, 5);
}

export function matchScore(
  talent: ProfileState,
  company: CompanyProfileState,
): number {
  const pairs: [string[], string[]][] = [
    [talent.workStyle, company.workEnvironment],
    [talent.drives, company.values],
    [talent.lookingFor, company.lookingFor],
  ];
  let shared = 0;
  let total = 0;
  for (const [a, b] of pairs) {
    total += Math.max(a.length, b.length, 1);
    shared += overlap(a, b).length;
  }
  const sameIndustry =
    talent.industry &&
    company.industry &&
    talent.industry.toLowerCase() === company.industry.toLowerCase();

  const raw = (shared / total) * 70 + (sameIndustry ? 15 : 0) + 15;
  return Math.min(98, Math.max(60, Math.round(raw)));
}

export const TALENT_EXPLORE_PROMPTS = [
  "What drives them",
  "How they like to work",
  "What they're looking for next",
];

export const COMPANY_EXPLORE_PROMPTS = [
  "What the team is building",
  "How they work day to day",
  "What they're looking for right now",
];
