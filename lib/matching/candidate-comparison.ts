import type { MatchReport, GapKind } from "@/lib/matching/report";
import type { MatchFactorKey } from "@/lib/matching/engine";

// Deterministic head-to-head comparison between two already-computed
// MatchReports for the same role — "why A over B", not just two numbers.
// No new scoring, no AI call: reads each report's existing axes / why /
// risks / salaryGapPercent (same data pool-insight.ts aggregates across
// many candidates) and explains where these two specifically differ.

const AXIS_TIE_THRESHOLD = 8;
const OVERALL_TIE_THRESHOLD = 5;
const FACTOR_RANK_TIE_THRESHOLD = 2;
const SALARY_TIE_THRESHOLD = 5;

type Side = "a" | "b" | "tie";

export type ComparisonHighlight = {
  key: string;
  label: string;
  edge: Side;
  detail: string;
};

export type CandidateComparison = {
  aName: string;
  bName: string;
  aOverall: number;
  bOverall: number;
  overallEdge: Side;
  axisHighlights: ComparisonHighlight[];
  factorHighlights: ComparisonHighlight[];
  salaryNote: string | null;
  summary: string;
};

const STRENGTH_RANK: Record<GapKind | "aligned", number> = {
  aligned: 3,
  preference: 2,
  development: 1,
  hard: 0,
  unknown: -1, // never compared — no real evidence either way
};

function edgeFromDiff(diff: number, threshold: number): Side {
  if (diff > threshold) return "a";
  if (diff < -threshold) return "b";
  return "tie";
}

/** Every factor either candidate has real evidence for — aligned (from
 *  `why`) or a classified gap (from `risks`, excluding "unknown"). */
function factorStrengths(
  report: MatchReport,
): Map<MatchFactorKey, { rank: number; label: string; finding: string }> {
  const map = new Map<
    MatchFactorKey,
    { rank: number; label: string; finding: string }
  >();
  for (const bullet of report.why) {
    map.set(bullet.key, {
      rank: STRENGTH_RANK.aligned,
      label: bullet.label,
      finding: bullet.finding,
    });
  }
  for (const risk of report.risks) {
    if (risk.gapKind === "unknown") continue;
    if (risk.key === "salary" || risk.key === "mutual") continue;
    const key = risk.key as MatchFactorKey;
    if (map.has(key)) continue; // why already covers it as aligned
    map.set(key, {
      rank: STRENGTH_RANK[risk.gapKind],
      label: risk.label,
      finding: risk.finding,
    });
  }
  return map;
}

export function buildCandidateComparison(
  a: { name: string; report: MatchReport },
  b: { name: string; report: MatchReport },
): CandidateComparison {
  const overallEdge = edgeFromDiff(
    a.report.overall - b.report.overall,
    OVERALL_TIE_THRESHOLD,
  );

  const axisHighlights: (ComparisonHighlight & { gap: number })[] =
    a.report.axes.map((axisA) => {
      const scoreB =
        b.report.axes.find((axis) => axis.id === axisA.id)?.score ?? 0;
      const diff = axisA.score - scoreB;
      return {
        key: axisA.id,
        label: axisA.label,
        edge: edgeFromDiff(diff, AXIS_TIE_THRESHOLD),
        detail: `${a.name} ${axisA.score}% · ${b.name} ${scoreB}%`,
        gap: Math.abs(diff),
      };
    });

  const strengthsA = factorStrengths(a.report);
  const strengthsB = factorStrengths(b.report);
  const factorKeys = new Set<MatchFactorKey>([
    ...strengthsA.keys(),
    ...strengthsB.keys(),
  ]);
  const factorHighlights: (ComparisonHighlight & { gap: number })[] = [];
  for (const key of factorKeys) {
    const sa = strengthsA.get(key);
    const sb = strengthsB.get(key);
    if (!sa || !sb) continue; // only compare what's evaluated for both
    const diff = sa.rank - sb.rank;
    if (Math.abs(diff) < FACTOR_RANK_TIE_THRESHOLD) continue;
    const edge: Side = diff > 0 ? "a" : "b";
    const strongerName = edge === "a" ? a.name : b.name;
    const weakerName = edge === "a" ? b.name : a.name;
    const weakerFinding = edge === "a" ? sb.finding : sa.finding;
    const label = edge === "a" ? sa.label : sb.label;
    factorHighlights.push({
      key,
      label,
      edge,
      detail: `${strongerName} stronger on ${label.toLowerCase()} — ${weakerName}: ${weakerFinding}`,
      gap: Math.abs(diff),
    });
  }
  factorHighlights.sort((x, y) => y.gap - x.gap);

  const gapA = a.report.salaryGapPercent;
  const gapB = b.report.salaryGapPercent;
  let salaryNote: string | null = null;
  if (gapA != null && gapB != null) {
    if (Math.abs(gapA - gapB) >= SALARY_TIE_THRESHOLD) {
      const closer = gapA < gapB ? a.name : b.name;
      salaryNote = `${closer}'s compensation expectations sit closer to the role's budget.`;
    }
  } else if (gapA != null) {
    salaryNote = `${b.name}'s compensation expectations look aligned with the role's budget; ${a.name}'s differ by about ${gapA}%.`;
  } else if (gapB != null) {
    salaryNote = `${a.name}'s compensation expectations look aligned with the role's budget; ${b.name}'s differ by about ${gapB}%.`;
  }

  const leadAxis = [...axisHighlights]
    .filter((axis) => axis.edge !== "tie")
    .sort((x, y) => y.gap - x.gap)[0];
  const overallLine =
    overallEdge === "tie"
      ? `${a.name} and ${b.name} are close overall (${a.report.overall}% vs ${b.report.overall}%).`
      : overallEdge === "a"
        ? `${a.name} leads overall (${a.report.overall}% vs ${b.report.overall}%).`
        : `${b.name} leads overall (${b.report.overall}% vs ${a.report.overall}%).`;
  const axisLine = leadAxis
    ? ` Driven mainly by ${leadAxis.label.toLowerCase()}, where ${
        leadAxis.edge === "a" ? a.name : b.name
      } is stronger.`
    : "";
  const summary = overallLine + axisLine;

  return {
    aName: a.name,
    bName: b.name,
    aOverall: a.report.overall,
    bOverall: b.report.overall,
    overallEdge,
    axisHighlights: axisHighlights.map(({ gap: _gap, ...rest }) => rest),
    factorHighlights: factorHighlights
      .slice(0, 4)
      .map(({ gap: _gap, ...rest }) => rest),
    salaryNote,
    summary,
  };
}
