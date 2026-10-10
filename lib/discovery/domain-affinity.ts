/**
 * Soft domain affinity for Discover: companies only see talent in domains
 * they hire for (or closely related), and talent only sees roles in their
 * search domain. Not a hard keyword equality — synonym groups allow near matches.
 */

const DOMAIN_GROUPS: string[][] = [
  [
    "software",
    "fullstack",
    "full-stack",
    "frontend",
    "backend",
    "developer",
    "dev",
    "engineer",
    "engineering",
    "programming",
    "typescript",
    "javascript",
    "react",
    "node",
    "python",
    "java",
    "mobile",
    "ios",
    "android",
    "devops",
    "sre",
    "platform",
    "web",
  ],
  [
    "electrical",
    "electronics",
    "pcb",
    "board",
    "hardware",
    "firmware",
    "embedded",
    "fpga",
    "asic",
    "rf",
    "analog",
    "digital",
    "schematic",
  ],
  [
    "marketing",
    "growth",
    "brand",
    "content",
    "seo",
    "sem",
    "ppc",
    "performance",
    "lifecycle",
  ],
  [
    "product",
    "pm",
    "roadmap",
    "discovery",
    "owner",
  ],
  [
    "design",
    "ux",
    "ui",
    "figma",
    "research",
    "visual",
  ],
  [
    "data",
    "analytics",
    "scientist",
    "ml",
    "ai",
    "machine",
    "bi",
  ],
  [
    "sales",
    "account",
    "ae",
    "sdr",
    "bdr",
    "customer",
    "success",
    "csm",
    "support",
  ],
  [
    "people",
    "hr",
    "recruit",
    "talent",
    "peopleops",
  ],
  [
    "finance",
    "controller",
    "accounting",
  ],
  [
    "ops",
    "operations",
    "program",
    "project",
    "delivery",
  ],
  [
    "construction",
    "infrastructure",
    "civil",
    "site",
    "building",
  ],
  [
    "chemical",
    "biochem",
    "biotech",
    "lab",
    "process",
  ],
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s/_.,+-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function groupIdsForToken(token: string): Set<number> {
  const hits = new Set<number>();
  DOMAIN_GROUPS.forEach((group, index) => {
    if (group.some((g) => token === g || token.includes(g) || g.includes(token))) {
      hits.add(index);
    }
  });
  return hits;
}

export function domainSignature(parts: Array<string | null | undefined>): Set<number> {
  const groups = new Set<number>();
  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part?.trim()) continue;
    for (const token of tokenize(part)) {
      tokens.add(token);
      for (const id of groupIdsForToken(token)) groups.add(id);
    }
  }
  // Keep raw tokens as negative-space markers via offset ids when no group hits
  if (groups.size === 0 && tokens.size > 0) {
    // No known group — allow match only on shared raw tokens later
    return new Set([-1]);
  }
  return groups;
}

export function domainsCompatible(
  a: Set<number>,
  b: Set<number>,
): boolean {
  if (a.size === 0 || b.size === 0) return true; // incomplete profiles: don't over-filter
  if (a.has(-1) || b.has(-1)) {
    // Unknown domain text — require at least one shared raw approach: treat as soft pass
    // when either side is unknown so Early Access isn't empty.
    return true;
  }
  for (const id of a) {
    if (b.has(id)) return true;
  }
  return false;
}

/** Company hiring domains from open roles + profile. */
export function companyHiringSignature(input: {
  industry?: string | null;
  lookingFor?: string[] | null;
  roleTitles?: Array<string | null | undefined>;
  roleDepartments?: Array<string | null | undefined>;
}): Set<number> {
  return domainSignature([
    input.industry,
    ...(input.lookingFor ?? []),
    ...(input.roleTitles ?? []),
    ...(input.roleDepartments ?? []),
  ]);
}

/** Talent search / background domains. */
export function talentDomainSignature(input: {
  industry?: string | null;
  currentRole?: string | null;
  targetRole?: string | null;
  headline?: string | null;
  skills?: string[] | null;
}): Set<number> {
  return domainSignature([
    input.industry,
    input.currentRole,
    input.targetRole,
    input.headline,
    ...(input.skills ?? []).slice(0, 8),
  ]);
}

/**
 * Exempt company accounts from domain filtering (e.g. internal test company).
 * Set DISCOVER_DOMAIN_EXEMPT_USER_IDS or DISCOVER_DOMAIN_EXEMPT_EMAILS.
 */
export function isDiscoverDomainExempt(input: {
  userId: string;
  email?: string | null;
  companyName?: string | null;
}): boolean {
  const ids =
    process.env.DISCOVER_DOMAIN_EXEMPT_USER_IDS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  if (ids.includes(input.userId)) return true;

  const emails =
    process.env.DISCOVER_DOMAIN_EXEMPT_EMAILS?.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? [];
  if (input.email && emails.includes(input.email.toLowerCase())) return true;

  const name = input.companyName?.toLowerCase() ?? "";
  if (name && (name.includes("test company") || name === "test" || name.includes("mingle test"))) {
    return true;
  }
  return false;
}
