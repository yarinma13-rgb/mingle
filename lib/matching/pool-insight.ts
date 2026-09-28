import type { MatchReport } from "@/lib/matching/report";
import type { MatchFactorKey } from "@/lib/matching/engine";

// Pool-level recruiting intelligence: looks across every candidate ranked
// for a role (not just one match at a time) to spot a single requirement
// that's quietly filtering out otherwise-strong people. Reuses each
// candidate's already-computed MatchReport.risks — no new scoring, no AI
// call, no migration. Deterministic and evidence-based, matching the
// "never fabricate market intelligence — say so if there isn't enough
// data" rule the rest of the matching intelligence follows.

const MIN_POOL_SIZE = 5;
const DOMINANT_SHARE = 0.4;
const CONSIDERED_MIN_SCORE = 50;

type RiskKey = MatchFactorKey | "salary" | "mutual";

const FACTOR_LABEL: Record<RiskKey, string> = {
  careerGoals: "career goals",
  motivations: "values",
  workStyle: "work style",
  industry: "industry",
  experience: "experience",
  skills: "skills",
  location: "location",
  companyStage: "company stage",
  salary: "compensation expectations",
  mutual: "mutual fit",
};

export type PoolInsight = {
  key: RiskKey;
  label: string;
  poolSize: number;
  affectedCount: number;
  otherwiseStrongCount: number;
  message: string;
};

/**
 * Looks at every candidate scored 50+ for a role (a "considered" pool —
 * candidates far below that bar would skew the pattern) and finds the
 * single requirement most often holding otherwise-strong people back.
 * Returns null when the pool is too small or no one requirement clearly
 * dominates, rather than guessing.
 */
export function buildPoolInsight(
  cards: { report: MatchReport }[],
): PoolInsight | null {
  const considered = cards.filter(
    (card) => card.report.overall >= CONSIDERED_MIN_SCORE,
  );
  if (considered.length < MIN_POOL_SIZE) return null;

  const counts = new Map<RiskKey, number>();
  for (const card of considered) {
    const keysOnCard = new Set(card.report.risks.map((risk) => risk.key));
    for (const key of keysOnCard) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  let topKey: RiskKey | null = null;
  let topCount = 0;
  for (const [key, count] of counts) {
    if (count > topCount) {
      topKey = key;
      topCount = count;
    }
  }
  if (!topKey || topCount / considered.length < DOMINANT_SHARE) return null;

  // "Otherwise strong": every other risk on their card (if any) is just
  // missing information, not a real mismatch — so this one requirement is
  // genuinely what's holding them back.
  const otherwiseStrongCount = considered.filter((card) => {
    const risks = card.report.risks;
    const hasFlagged = risks.some((risk) => risk.key === topKey);
    if (!hasFlagged) return false;
    return risks.every(
      (risk) => risk.key === topKey || risk.gapKind === "unknown",
    );
  }).length;

  const label = FACTOR_LABEL[topKey] ?? String(topKey);
  const message =
    otherwiseStrongCount > 0
      ? `${topCount} of ${considered.length} candidates you're evaluating for this role score lower mainly because of ${label}. ${otherwiseStrongCount} of them are otherwise strong across every other signal — worth checking whether this is truly a must-have.`
      : `${topCount} of ${considered.length} candidates you're evaluating for this role score lower mainly because of ${label}.`;

  return {
    key: topKey,
    label,
    poolSize: considered.length,
    affectedCount: topCount,
    otherwiseStrongCount,
    message,
  };
}
