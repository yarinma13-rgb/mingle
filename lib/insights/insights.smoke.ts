/**
 * Pure checks for the Insights calculations (no DB/React).
 * Run: npx --yes tsx lib/insights/insights.smoke.ts
 */
import {
  companyInsights,
  interviewIntelligence,
  roleSummaries,
  stageStats,
  stalledConnections,
  timeToDecision,
  weeklyConnections,
  type PipelineInput,
} from "@/lib/insights/compute";

function expect(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const DAY = 86_400_000;
const now = Date.parse("2026-10-22T12:00:00Z");
const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();

const inputs: PipelineInput[] = [
  { connectionId: "a", createdAt: iso(40), roleId: "r1", events: [{ stage: "exploring", createdAt: iso(38) }, { stage: "interview_booked", createdAt: iso(30) }, { stage: "decision", createdAt: iso(20) }] },
  { connectionId: "b", createdAt: iso(30), roleId: "r1", events: [{ stage: "exploring", createdAt: iso(29) }] },
  { connectionId: "c", createdAt: iso(3), roleId: null, events: [] },
  { connectionId: "d", createdAt: iso(20), roleId: "r2", events: [{ stage: "in_conversation", createdAt: iso(18) }] },
  { connectionId: "e", createdAt: iso(10), roleId: "r2", events: [] },
];

const stats = stageStats(inputs);
expect(stats[0].reached === 5, "everyone is connected");
expect(stats[1].reached === 3, "exploring reached counts later stages (a, b, d via in_conversation)");
expect(stats[3].reached === 1, "interview_booked reached = a");
expect(stats[0].conversionToNext === 3 / 5, "connected -> exploring conversion");
expect(stats[5].reached === 1 && stats[6].reached === 0, "decision reached, relationship not");

const ttd = timeToDecision(inputs);
expect(ttd.sampleSize === 1 && Math.round(ttd.averageDays ?? 0) === 20, "time to decision = 20 days for a");

expect(stalledConnections(inputs, now).map((i) => i.connectionId).sort().join() === "b,d", "stalled = quiet 14+ days, no decision (e is only 10 days old, a decided)");

const weeks = weeklyConnections(inputs.map((i) => i.createdAt), now, 8);
expect(weeks.length === 8 && weeks.reduce((n, w) => n + w.count, 0) === 5, "all 5 connections fall within 8 weeks");
expect(weeks[7].count === 1 && weeks[6].count === 1, "c (3d ago) is in the latest week, e (10d ago) in the one before");

const roles = [
  { id: "r1", title: "Engineer", status: "open" as const, createdAt: iso(50) },
  { id: "r2", title: "Designer", status: "open" as const, createdAt: iso(5) },
  { id: "r3", title: "Analyst", status: "open" as const, createdAt: iso(45) },
];
const summaries = roleSummaries(inputs, roles, now);
expect(summaries.find((r) => r.roleId === "r1")?.reachedDecision === 1, "r1 has one decision");
expect(summaries.find((r) => r.roleId === "r3")?.candidates === 0, "r3 empty");

const ii = interviewIntelligence(
  [{ status: "completed", scheduledAt: iso(5) }, { status: "completed", scheduledAt: iso(4) }, { status: "cancelled", scheduledAt: iso(3) }, { status: "scheduled", scheduledAt: iso(-2) }],
  [{ technicalFit: 4, roleFit: 5, teamFit: null, motivationFit: 3, recommendation: "advance" }, { technicalFit: 2, roleFit: null, teamFit: null, motivationFit: null, recommendation: "" }],
);
expect(ii.total === 4 && ii.cancelled === 1 && ii.cancellationRate === 0.25, "interview counts");
expect(ii.averages.technical === 3 && ii.averages.team === null, "averages ignore nulls");
expect(ii.recommendations.advance === 1 && ii.recommendations.undecided === 1, "recommendation split");
expect(ii.feedbackRate === 1, "2 feedback for 2 completed, capped at 1");

const insights = companyInsights({ inputs, roles: summaries, interviews: ii, stats, now });
expect(insights.some((i) => i.title.includes("gone quiet")), "stalled insight");
expect(insights.some((i) => i.title.includes("no pipeline")), "idle role insight (r3, 45 days, 0 candidates)");
expect(companyInsights({ inputs: [], roles: [], interviews: interviewIntelligence([], []), stats: stageStats([]), now }).length === 0, "no data -> no insights");

console.log("insights smoke: ok");
