import type { ProfileState } from "@/lib/profile/persistence";
import type { CompanyProfileState } from "@/lib/company-profile/persistence";
import { overlapCanonical } from "@/lib/matching/synonyms";

function overlap(a: string[], b: string[]): string[] {
  return overlapCanonical(a, b);
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

const SCORE_CACHE = new Map<string, number>();
const SCORE_CACHE_LIMIT = 200;

function scoreCacheKey(
  talent: ProfileState,
  company: CompanyProfileState,
): string {
  return JSON.stringify([
    talent.workStyle,
    talent.drives,
    talent.lookingFor,
    talent.industry,
    company.workEnvironment,
    company.values,
    company.lookingFor,
    company.industry,
  ]);
}

export function matchScore(
  talent: ProfileState,
  company: CompanyProfileState,
): number {
  const key = scoreCacheKey(talent, company);
  const cached = SCORE_CACHE.get(key);
  if (cached !== undefined) return cached;

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
  const score = Math.min(98, Math.max(60, Math.round(raw)));
  if (SCORE_CACHE.size >= SCORE_CACHE_LIMIT) {
    const oldest = SCORE_CACHE.keys().next().value;
    if (oldest !== undefined) SCORE_CACHE.delete(oldest);
  }
  SCORE_CACHE.set(key, score);
  return score;
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
