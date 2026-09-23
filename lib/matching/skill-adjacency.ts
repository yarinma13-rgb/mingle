/**
 * Adjacent / transferable skill groups for Role Fit.
 * Exact canonical overlap still wins; adjacency only soft-boosts and
 * must be labeled as inference — never claimed as equivalence.
 */

import { canonicalize } from "@/lib/matching/synonyms";

/** Groups of skills that may transfer across adjacent domains. */
export const SKILL_ADJACENCY_GROUPS: readonly (readonly string[])[] = [
  [
    "react",
    "vue",
    "angular",
    "svelte",
    "javascript",
    "typescript",
    "frontend",
    "front-end",
    "next.js",
    "nextjs",
    "html",
    "css",
  ],
  [
    "node",
    "node.js",
    "nodejs",
    "python",
    "java",
    "golang",
    "go",
    "ruby",
    "php",
    "backend",
    "back-end",
    "nestjs",
    "django",
    "fastapi",
    "spring",
  ],
  [
    "aws",
    "gcp",
    "azure",
    "devops",
    "kubernetes",
    "k8s",
    "docker",
    "terraform",
    "ci/cd",
    "infra",
    "infrastructure",
  ],
  [
    "figma",
    "sketch",
    "product design",
    "ux",
    "ui",
    "ui/ux",
    "design systems",
    "user research",
    "prototyping",
    "wireframing",
  ],
  [
    "sql",
    "postgres",
    "postgresql",
    "mysql",
    "data",
    "analytics",
    "etl",
    "dbt",
    "snowflake",
    "bigquery",
    "tableau",
    "looker",
  ],
  [
    "saas",
    "b2b",
    "fintech",
    "marketplace",
    "product",
    "product management",
    "roadmap",
  ],
  [
    "recruiting",
    "talent acquisition",
    "sourcing",
    "hr",
    "people ops",
    "hiring",
  ],
  [
    "sales",
    "account executive",
    "bdr",
    "sdr",
    "business development",
    "customer success",
  ],
];

const SKILL_TO_GROUPS = new Map<string, number[]>();

SKILL_ADJACENCY_GROUPS.forEach((group, index) => {
  for (const skill of group) {
    const key = canonicalize(skill);
    const existing = SKILL_TO_GROUPS.get(key) ?? [];
    if (!existing.includes(index)) existing.push(index);
    SKILL_TO_GROUPS.set(key, existing);
  }
});

export type AdjacentSkillHit = {
  required: string;
  talentSkill: string;
  groupHint: string;
};

function groupHint(index: number): string {
  const sample = SKILL_ADJACENCY_GROUPS[index]?.slice(0, 3).join(" / ") ?? "adjacent";
  return sample;
}

/**
 * Find required skills not exactly covered that may be adjacent to a
 * talent skill. Never claims equivalence — callers must mark as inference.
 */
export function findAdjacentSkillHits(
  talentSkills: string[],
  requiredSkills: string[],
): AdjacentSkillHit[] {
  const talentCanon = talentSkills.map((s) => ({
    raw: s,
    key: canonicalize(s),
  }));
  const exact = new Set(
    talentSkills.map(canonicalize),
  );
  const hits: AdjacentSkillHit[] = [];
  const seenRequired = new Set<string>();

  for (const required of requiredSkills) {
    const reqKey = canonicalize(required);
    if (exact.has(reqKey) || seenRequired.has(reqKey)) continue;
    const reqGroups = SKILL_TO_GROUPS.get(reqKey);
    if (!reqGroups?.length) continue;

    for (const talent of talentCanon) {
      const talentGroups = SKILL_TO_GROUPS.get(talent.key);
      if (!talentGroups?.length) continue;
      const sharedGroup = reqGroups.find((g) => talentGroups.includes(g));
      if (sharedGroup == null) continue;
      seenRequired.add(reqKey);
      hits.push({
        required,
        talentSkill: talent.raw,
        groupHint: groupHint(sharedGroup),
      });
      break;
    }
  }

  return hits;
}

/** Soft coverage fraction: exact hits count 1, adjacent hits count 0.45. */
export function skillCoverageWithAdjacency(
  talentSkills: string[],
  requiredSkills: string[],
): {
  exact: string[];
  adjacent: AdjacentSkillHit[];
  fraction: number;
} {
  const exact = talentSkills.filter((skill) =>
    requiredSkills.some((req) => canonicalize(req) === canonicalize(skill)),
  );
  // Deduplicate exact by canonical
  const exactCanon = new Set(exact.map(canonicalize));
  const exactUnique = requiredSkills.filter((req) =>
    exactCanon.has(canonicalize(req)),
  );
  const adjacent = findAdjacentSkillHits(talentSkills, requiredSkills);
  if (requiredSkills.length === 0) {
    return { exact: exactUnique, adjacent: [], fraction: 0.55 };
  }
  const earned = exactUnique.length + adjacent.length * 0.45;
  const fraction = Math.min(1, earned / requiredSkills.length);
  return { exact: exactUnique, adjacent, fraction };
}
