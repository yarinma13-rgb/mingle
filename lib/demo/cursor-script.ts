import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoCursorAction = "move" | "click" | "hover" | "type";

export type DemoCursorBeat = {
  atMs: number;
  target: string;
  action?: DemoCursorAction;
  zoom?: number;
  typeText?: string;
};

/**
 * Guided attention path for investor demo v2 — calm, purposeful beats.
 */
export const DEMO_CURSOR_SCRIPT: Partial<Record<DemoSceneId, DemoCursorBeat[]>> = {
  problem: [
    { atMs: 500, target: "problem-keywords", action: "move", zoom: 1.02 },
    { atMs: 2800, target: "problem-human", action: "hover", zoom: 1.04 },
  ],
  introduce: [
    { atMs: 500, target: "role-banner", action: "move", zoom: 1.03 },
    { atMs: 1800, target: "kpi-matches", action: "move", zoom: 1.04 },
    { atMs: 3200, target: "candidate-emma", action: "hover", zoom: 1.05 },
    {
      atMs: 4500,
      target: "search-field",
      action: "type",
      zoom: 1.04,
      typeText: "Emma Carter",
    },
    { atMs: 6500, target: "view-candidates", action: "click", zoom: 1.03 },
  ],
  company: [
    { atMs: 450, target: "role-title", action: "move", zoom: 1.04 },
    { atMs: 1800, target: "role-skills", action: "hover", zoom: 1.05 },
    { atMs: 3800, target: "role-beyond", action: "hover", zoom: 1.04 },
  ],
  profile: [
    { atMs: 500, target: "profile-avatar", action: "move", zoom: 1.04 },
    { atMs: 2800, target: "profile-values", action: "hover", zoom: 1.05 },
    { atMs: 5500, target: "profile-goals", action: "hover", zoom: 1.04 },
    { atMs: 8500, target: "profile-connect", action: "click", zoom: 1.04 },
  ],
  match: [
    { atMs: 400, target: "match-score", action: "move", zoom: 1.06 },
    { atMs: 2800, target: "match-report", action: "hover", zoom: 1.04 },
    { atMs: 6000, target: "match-aligned", action: "hover", zoom: 1.04 },
  ],
  mingleMoment: [
    { atMs: 900, target: "mingle-cta", action: "move", zoom: 1.03 },
    { atMs: 2600, target: "mingle-cta", action: "click", zoom: 1.04 },
  ],
  conversation: [
    { atMs: 500, target: "chat-thread", action: "move", zoom: 1.03 },
    { atMs: 2200, target: "chat-context", action: "hover", zoom: 1.04 },
    {
      atMs: 4500,
      target: "chat-composer",
      action: "type",
      zoom: 1.04,
      typeText: "Perfect — I'll bring a few product examples for Thursday.",
    },
    { atMs: 10000, target: "chat-send", action: "click", zoom: 1.04 },
  ],
  recommendations: [
    { atMs: 500, target: "rec-first", action: "move", zoom: 1.04 },
    { atMs: 2800, target: "rec-stars", action: "hover", zoom: 1.05 },
    { atMs: 5200, target: "rec-linkedin", action: "hover", zoom: 1.04 },
  ],
};

export function activeCursorBeat(
  script: DemoCursorBeat[] | undefined,
  elapsedMs: number,
): DemoCursorBeat | null {
  if (!script?.length) return null;
  let current: DemoCursorBeat | null = null;
  for (const beat of script) {
    if (beat.atMs <= elapsedMs) current = beat;
  }
  return current;
}

export function beatKey(beat: DemoCursorBeat | null): string {
  if (!beat) return "";
  return `${beat.target}:${beat.action ?? "move"}:${beat.zoom ?? 1}`;
}
