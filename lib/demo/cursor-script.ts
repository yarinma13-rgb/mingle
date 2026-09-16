import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoCursorAction = "move" | "click" | "hover" | "type";

export type DemoCursorBeat = {
  /** ms from scene start */
  atMs: number;
  /** Matches [data-demo-target="..."] */
  target: string;
  action?: DemoCursorAction;
  /** Camera zoom toward target (1 = none). Keep subtle to avoid flicker. */
  zoom?: number;
  /** Auto-type into the focused field when action is "type". */
  typeText?: string;
};

/**
 * Guided attention path for the investor script — calm, purposeful beats.
 */
export const DEMO_CURSOR_SCRIPT: Partial<Record<DemoSceneId, DemoCursorBeat[]>> = {
  introduce: [
    { atMs: 500, target: "role-banner", action: "move", zoom: 1.03 },
    { atMs: 1600, target: "kpi-matches", action: "move", zoom: 1.04 },
    { atMs: 2800, target: "candidate-emma", action: "hover", zoom: 1.05 },
    {
      atMs: 4000,
      target: "search-field",
      action: "type",
      zoom: 1.04,
      typeText: "Emma Carter",
    },
    { atMs: 5800, target: "view-candidates", action: "click", zoom: 1.03 },
  ],
  company: [
    { atMs: 400, target: "role-title", action: "move", zoom: 1.04 },
    { atMs: 1600, target: "role-skills", action: "hover", zoom: 1.05 },
    { atMs: 3400, target: "role-beyond", action: "hover", zoom: 1.04 },
  ],
  profile: [
    { atMs: 500, target: "profile-avatar", action: "move", zoom: 1.04 },
    { atMs: 2800, target: "profile-values", action: "hover", zoom: 1.05 },
    { atMs: 5500, target: "profile-goals", action: "hover", zoom: 1.04 },
    { atMs: 8000, target: "profile-connect", action: "click", zoom: 1.04 },
  ],
  match: [
    { atMs: 400, target: "match-score", action: "move", zoom: 1.06 },
    { atMs: 2800, target: "match-report", action: "hover", zoom: 1.04 },
    { atMs: 6000, target: "match-aligned", action: "hover", zoom: 1.04 },
  ],
  mingleMoment: [
    { atMs: 900, target: "mingle-cta", action: "move", zoom: 1.03 },
    { atMs: 2200, target: "mingle-cta", action: "click", zoom: 1.04 },
  ],
  conversation: [
    { atMs: 500, target: "chat-thread", action: "move", zoom: 1.03 },
    { atMs: 2200, target: "chat-context", action: "hover", zoom: 1.04 },
    {
      atMs: 4000,
      target: "chat-composer",
      action: "type",
      zoom: 1.04,
      typeText: "Perfect — I'll bring a few product examples for Thursday.",
    },
    { atMs: 9000, target: "chat-send", action: "click", zoom: 1.04 },
  ],
  recommendations: [
    { atMs: 500, target: "rec-first", action: "move", zoom: 1.04 },
    { atMs: 2800, target: "rec-stars", action: "hover", zoom: 1.05 },
    { atMs: 4800, target: "rec-linkedin", action: "hover", zoom: 1.04 },
  ],
  talent: [
    { atMs: 400, target: "talent-card", action: "move", zoom: 1.03 },
    { atMs: 1500, target: "talent-score", action: "hover", zoom: 1.05 },
    { atMs: 3000, target: "talent-interested", action: "click", zoom: 1.04 },
  ],
  board: [
    { atMs: 400, target: "board-conversation", action: "move", zoom: 1.04 },
    { atMs: 1800, target: "board-interview", action: "click", zoom: 1.05 },
  ],
  darkMode: [
    { atMs: 300, target: "theme-toggle", action: "move", zoom: 1.06 },
    { atMs: 1000, target: "theme-toggle", action: "click", zoom: 1.06 },
  ],
  phase2: [
    { atMs: 450, target: "phase2-lifecycle", action: "move", zoom: 1.03 },
    { atMs: 1700, target: "phase2-automation", action: "move", zoom: 1.04 },
    { atMs: 3000, target: "phase2-mobile", action: "hover", zoom: 1.04 },
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
