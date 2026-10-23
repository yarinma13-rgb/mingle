/**
 * Pure calculations behind the company Insights screens (reports, interview
 * intelligence, company insights, analytics). No DB or React here — the loader
 * hands in plain data, so every number is deterministic and testable.
 * Nothing is estimated or invented: when there isn't enough data a function
 * returns null / an empty list and the UI says so.
 */

import type { RelationshipStage } from "@/lib/supabase/types";

export const STAGE_ORDER: RelationshipStage[] = [
  "connected",
  "exploring",
  "in_conversation",
  "interview_booked",
  "opportunity",
  "decision",
  "relationship",
];

export const STAGE_LABEL: Record<RelationshipStage, string> = {
  connected: "Connected",
  exploring: "Exploring",
  in_conversation: "In conversation",
  interview_booked: "Interview booked",
  opportunity: "Opportunity",
  decision: "Decision",
  relationship: "Relationship",
};

const DAY_MS = 86_400_000;
const DECISION_INDEX = STAGE_ORDER.indexOf("decision");

export type PipelineInput = {
  connectionId: string;
  /** When the connection was accepted/created. */
  createdAt: string;
  events: { stage: RelationshipStage; createdAt: string }[];
  roleId: string | null;
};

/** Earliest time each connection reached stage index >= s (undefined = never). */
function firstReached(input: PipelineInput): (number | undefined)[] {
  const result: (number | undefined)[] = STAGE_ORDER.map(() => undefined);
  const base = new Date(input.createdAt).getTime();
  // No event is needed to count as "connected".
  result[0] = base;
  for (const event of input.events) {
    const idx = STAGE_ORDER.indexOf(event.stage);
    if (idx < 0) continue;
    const at = new Date(event.createdAt).getTime();
    for (let s = 1; s <= idx; s += 1) {
      const current = result[s];
      if (current === undefined || at < current) result[s] = at;
    }
  }
  return result;
}

export function highestStageIndex(input: PipelineInput): number {
  let best = 0;
  for (const event of input.events) {
    const idx = STAGE_ORDER.indexOf(event.stage);
    if (idx > best) best = idx;
  }
  return best;
}

export type StageStat = {
  stage: RelationshipStage;
  label: string;
  /** Connections that reached this stage or beyond. */
  reached: number;
  /** Share that went on to the next stage (null on the last stage / no data). */
  conversionToNext: number | null;
  /** Average days from reaching this stage to reaching the next (null if no sample). */
  avgDaysToNext: number | null;
  sampleToNext: number;
};

export function stageStats(inputs: PipelineInput[]): StageStat[] {
  const reachedTimes = inputs.map(firstReached);
  return STAGE_ORDER.map((stage, s) => {
    const reached = reachedTimes.filter((times) => times[s] !== undefined).length;
    if (s === STAGE_ORDER.length - 1) {
      return { stage, label: STAGE_LABEL[stage], reached, conversionToNext: null, avgDaysToNext: null, sampleToNext: 0 };
    }
    const next = reachedTimes.filter((times) => times[s + 1] !== undefined).length;
    const gaps: number[] = [];
    for (const times of reachedTimes) {
      const from = times[s];
      const to = times[s + 1];
      if (from === undefined || to === undefined) continue;
      const days = (to - from) / DAY_MS;
      if (days >= 0) gaps.push(days);
    }
    return {
      stage,
      label: STAGE_LABEL[stage],
      reached,
      conversionToNext: reached > 0 ? next / reached : null,
      avgDaysToNext: gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
      sampleToNext: gaps.length,
    };
  });
}

/** Average days from connected to a decision, over connections that got there. */
export function timeToDecision(inputs: PipelineInput[]): { averageDays: number | null; sampleSize: number } {
  const days: number[] = [];
  for (const input of inputs) {
    const times = firstReached(input);
    const start = times[0];
    const end = times[DECISION_INDEX];
    if (start === undefined || end === undefined) continue;
    const d = (end - start) / DAY_MS;
    if (d >= 0) days.push(d);
  }
  if (days.length === 0) return { averageDays: null, sampleSize: 0 };
  return { averageDays: days.reduce((a, b) => a + b, 0) / days.length, sampleSize: days.length };
}

export type WeekBucket = { weekStart: string; count: number };

/** New connections per week for the last `weeks` weeks (oldest first). */
export function weeklyConnections(createdAts: string[], now: number, weeks = 8): WeekBucket[] {
  const WEEK_MS = 7 * DAY_MS;
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = now - (i + 1) * WEEK_MS;
    buckets.push({ weekStart: new Date(start).toISOString().slice(0, 10), count: 0 });
  }
  for (const iso of createdAts) {
    const age = now - new Date(iso).getTime();
    if (age < 0 || age >= weeks * WEEK_MS) continue;
    const idxFromEnd = Math.floor(age / WEEK_MS);
    buckets[weeks - 1 - idxFromEnd].count += 1;
  }
  return buckets;
}

export function lastActivityAt(input: PipelineInput): number {
  let latest = new Date(input.createdAt).getTime();
  for (const event of input.events) {
    const at = new Date(event.createdAt).getTime();
    if (at > latest) latest = at;
  }
  return latest;
}

/** Connections with no movement for `days`, that haven't reached a decision yet. */
export function stalledConnections(inputs: PipelineInput[], now: number, days = 14): PipelineInput[] {
  return inputs.filter(
    (input) =>
      highestStageIndex(input) < DECISION_INDEX && now - lastActivityAt(input) >= days * DAY_MS,
  );
}

export type RoleSummary = {
  roleId: string;
  title: string;
  status: "open" | "paused" | "closed";
  openDays: number;
  candidates: number;
  reachedInterview: number;
  reachedDecision: number;
};

export function roleSummaries(
  inputs: PipelineInput[],
  roles: { id: string; title: string; status: "open" | "paused" | "closed"; createdAt: string }[],
  now: number,
): RoleSummary[] {
  const interviewIdx = STAGE_ORDER.indexOf("interview_booked");
  return roles
    .map((role) => {
      const mine = inputs.filter((input) => input.roleId === role.id);
      return {
        roleId: role.id,
        title: role.title,
        status: role.status,
        openDays: Math.max(0, Math.floor((now - new Date(role.createdAt).getTime()) / DAY_MS)),
        candidates: mine.length,
        reachedInterview: mine.filter((i) => highestStageIndex(i) >= interviewIdx).length,
        reachedDecision: mine.filter((i) => highestStageIndex(i) >= DECISION_INDEX).length,
      };
    })
    .sort((a, b) => {
      const rank = { open: 0, paused: 1, closed: 2 } as const;
      return rank[a.status] - rank[b.status] || b.candidates - a.candidates;
    });
}

// ---------------------------------------------------------------- interviews

export type InterviewInput = { status: "scheduled" | "completed" | "cancelled"; scheduledAt: string };
export type FeedbackInput = {
  technicalFit: number | null;
  roleFit: number | null;
  teamFit: number | null;
  motivationFit: number | null;
  recommendation: string | null;
};

export type InterviewIntelligence = {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  cancellationRate: number | null;
  feedbackCount: number;
  /** Feedback entries per completed interview, capped at 1 (approximate: feedback is stored per match, not per interview). */
  feedbackRate: number | null;
  averages: { technical: number | null; role: number | null; team: number | null; motivation: number | null };
  recommendations: { advance: number; hold: number; pass: number; undecided: number };
};

function avg(values: (number | null)[]): number | null {
  const real = values.filter((v): v is number => typeof v === "number");
  return real.length > 0 ? real.reduce((a, b) => a + b, 0) / real.length : null;
}

export function interviewIntelligence(
  interviews: InterviewInput[],
  feedback: FeedbackInput[],
): InterviewIntelligence {
  const scheduled = interviews.filter((i) => i.status === "scheduled").length;
  const completed = interviews.filter((i) => i.status === "completed").length;
  const cancelled = interviews.filter((i) => i.status === "cancelled").length;
  const recommendations = { advance: 0, hold: 0, pass: 0, undecided: 0 };
  for (const row of feedback) {
    const r = row.recommendation?.trim().toLowerCase();
    if (r === "advance" || r === "hold" || r === "pass") recommendations[r] += 1;
    else recommendations.undecided += 1;
  }
  return {
    total: interviews.length,
    scheduled,
    completed,
    cancelled,
    cancellationRate: interviews.length > 0 ? cancelled / interviews.length : null,
    feedbackCount: feedback.length,
    feedbackRate: completed > 0 ? Math.min(1, feedback.length / completed) : null,
    averages: {
      technical: avg(feedback.map((f) => f.technicalFit)),
      role: avg(feedback.map((f) => f.roleFit)),
      team: avg(feedback.map((f) => f.teamFit)),
      motivation: avg(feedback.map((f) => f.motivationFit)),
    },
    recommendations,
  };
}

// ------------------------------------------------------------ company insights

export type Insight = { tone: "warn" | "info" | "good"; title: string; body: string };

const MIN_SAMPLE = 5;

/**
 * Plain-language observations, each backed by a concrete count. Returns an
 * empty list (never filler) when there isn't enough data to say anything.
 */
export function companyInsights(args: {
  inputs: PipelineInput[];
  roles: RoleSummary[];
  interviews: InterviewIntelligence;
  stats: StageStat[];
  now: number;
}): Insight[] {
  const { inputs, roles, interviews, stats, now } = args;
  const out: Insight[] = [];

  const stalled = stalledConnections(inputs, now);
  if (stalled.length > 0) {
    out.push({
      tone: "warn",
      title: `${stalled.length} ${stalled.length === 1 ? "candidate has" : "candidates have"} gone quiet`,
      body: "No movement for 14+ days and no decision yet. A short message now keeps good candidates from drifting away.",
    });
  }

  const drop = stats
    .filter((s) => s.conversionToNext !== null && s.reached >= MIN_SAMPLE)
    .sort((a, b) => (a.conversionToNext ?? 1) - (b.conversionToNext ?? 1))[0];
  if (drop && (drop.conversionToNext ?? 1) < 0.5) {
    const pct = Math.round((1 - (drop.conversionToNext ?? 0)) * 100);
    out.push({
      tone: "info",
      title: `Biggest drop-off is after "${drop.label}"`,
      body: `${pct}% of the ${drop.reached} candidates who reached this stage did not move on.`,
    });
  }

  const idleRoles = roles.filter((r) => r.status === "open" && r.openDays >= 30 && r.candidates === 0);
  if (idleRoles.length > 0) {
    out.push({
      tone: "warn",
      title: `${idleRoles.length} open ${idleRoles.length === 1 ? "role has" : "roles have"} no pipeline after 30+ days`,
      body: `${idleRoles.slice(0, 3).map((r) => r.title).join(", ")}. Check the role details, or browse matches for ${idleRoles.length === 1 ? "it" : "them"}.`,
    });
  }

  if (interviews.total >= 4 && interviews.cancellationRate !== null && interviews.cancellationRate > 0.25) {
    out.push({
      tone: "warn",
      title: `${Math.round(interviews.cancellationRate * 100)}% of interviews were cancelled`,
      body: "Frequent cancellations hurt candidate experience. Offering more time options when scheduling can help.",
    });
  }

  if (interviews.completed >= 3 && interviews.feedbackRate !== null && interviews.feedbackRate < 0.5) {
    out.push({
      tone: "info",
      title: "Interview feedback is often missing",
      body: `Only ${interviews.feedbackCount} feedback ${interviews.feedbackCount === 1 ? "entry" : "entries"} for ${interviews.completed} completed interviews. Feedback is what makes interview intelligence useful.`,
    });
  }

  const decided = inputs.filter((i) => highestStageIndex(i) >= DECISION_INDEX).length;
  if (inputs.length >= MIN_SAMPLE && decided > 0) {
    out.push({
      tone: "good",
      title: `${decided} of ${inputs.length} connections reached a decision`,
      body: "Your pipeline is turning conversations into outcomes.",
    });
  }

  return out;
}

export function pct(value: number | null): string {
  return value === null ? "–" : `${Math.round(value * 100)}%`;
}

export function days(value: number | null): string {
  if (value === null) return "–";
  return value < 10 ? `${value.toFixed(1)} days` : `${Math.round(value)} days`;
}
