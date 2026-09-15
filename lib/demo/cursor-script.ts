import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoCursorAction = "move" | "click" | "hover" | "type";

export type DemoCursorBeat = {
  /** ms from scene start */
  atMs: number;
  /** Matches [data-demo-target="..."] */
  target: string;
  action?: DemoCursorAction;
  /** Camera zoom toward target (1 = none). */
  zoom?: number;
  /** Auto-type into the focused field when action is "type". */
  typeText?: string;
};

/**
 * Guided attention path — monday-style cursor + zoom + in-screen typing.
 * Targets must exist as data-demo-target in the rendered scene.
 */
export const DEMO_CURSOR_SCRIPT: Partial<Record<DemoSceneId, DemoCursorBeat[]>> = {
  introduce: [
    { atMs: 400, target: "role-banner", action: "move", zoom: 1.06 },
    { atMs: 1200, target: "kpi-matches", action: "move", zoom: 1.12 },
    { atMs: 2100, target: "candidate-emma", action: "hover", zoom: 1.14 },
    {
      atMs: 3000,
      target: "search-field",
      action: "type",
      zoom: 1.1,
      typeText: "Emma Carter",
    },
    { atMs: 4300, target: "view-candidates", action: "click", zoom: 1.08 },
  ],
  company: [
    { atMs: 350, target: "role-title", action: "move", zoom: 1.1 },
    { atMs: 1300, target: "role-skills", action: "hover", zoom: 1.14 },
    { atMs: 2800, target: "role-beyond", action: "hover", zoom: 1.12 },
  ],
  profile: [
    { atMs: 350, target: "profile-avatar", action: "move", zoom: 1.1 },
    { atMs: 1300, target: "profile-values", action: "hover", zoom: 1.14 },
    { atMs: 2800, target: "profile-connect", action: "click", zoom: 1.1 },
  ],
  match: [
    { atMs: 300, target: "match-score", action: "move", zoom: 1.18 },
    { atMs: 1600, target: "match-report", action: "hover", zoom: 1.1 },
  ],
  talent: [
    { atMs: 350, target: "talent-card", action: "move", zoom: 1.08 },
    { atMs: 1400, target: "talent-score", action: "hover", zoom: 1.16 },
    { atMs: 2800, target: "talent-interested", action: "click", zoom: 1.12 },
  ],
  mingleMoment: [
    { atMs: 800, target: "mingle-cta", action: "move", zoom: 1.08 },
    { atMs: 2200, target: "mingle-cta", action: "click", zoom: 1.12 },
  ],
  conversation: [
    { atMs: 400, target: "chat-thread", action: "move", zoom: 1.06 },
    { atMs: 1400, target: "chat-context", action: "hover", zoom: 1.1 },
    {
      atMs: 2600,
      target: "chat-composer",
      action: "type",
      zoom: 1.14,
      typeText: "Perfect — I'll bring a few product examples for Thursday.",
    },
    { atMs: 5600, target: "chat-send", action: "click", zoom: 1.12 },
  ],
  recommendations: [
    { atMs: 350, target: "rec-first", action: "move", zoom: 1.1 },
    { atMs: 1600, target: "rec-stars", action: "hover", zoom: 1.16 },
  ],
  board: [
    { atMs: 350, target: "board-conversation", action: "move", zoom: 1.1 },
    { atMs: 1700, target: "board-interview", action: "click", zoom: 1.14 },
  ],
  darkMode: [
    { atMs: 250, target: "theme-toggle", action: "move", zoom: 1.2 },
    { atMs: 900, target: "theme-toggle", action: "click", zoom: 1.22 },
  ],
  phase2: [
    { atMs: 400, target: "phase2-lifecycle", action: "move", zoom: 1.08 },
    { atMs: 1600, target: "phase2-automation", action: "move", zoom: 1.1 },
    { atMs: 2900, target: "phase2-mobile", action: "hover", zoom: 1.12 },
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
