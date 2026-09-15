import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoCursorAction = "move" | "click" | "hover";

export type DemoCursorBeat = {
  /** ms from scene start */
  atMs: number;
  /** Matches [data-demo-target="..."] */
  target: string;
  action?: DemoCursorAction;
};

/**
 * Guided attention path per scene — monday-style product demo cursor.
 * Targets must exist as data-demo-target in the rendered scene.
 */
export const DEMO_CURSOR_SCRIPT: Partial<Record<DemoSceneId, DemoCursorBeat[]>> = {
  introduce: [
    { atMs: 500, target: "role-banner", action: "move" },
    { atMs: 1400, target: "kpi-matches", action: "move" },
    { atMs: 2400, target: "candidate-emma", action: "move" },
    { atMs: 3400, target: "view-candidates", action: "click" },
  ],
  company: [
    { atMs: 400, target: "role-title", action: "move" },
    { atMs: 1400, target: "role-skills", action: "move" },
    { atMs: 2600, target: "role-beyond", action: "hover" },
  ],
  profile: [
    { atMs: 400, target: "profile-avatar", action: "move" },
    { atMs: 1400, target: "profile-values", action: "move" },
    { atMs: 2600, target: "profile-connect", action: "click" },
  ],
  match: [
    { atMs: 350, target: "match-score", action: "move" },
    { atMs: 1400, target: "match-report", action: "hover" },
  ],
  talent: [
    { atMs: 400, target: "talent-card", action: "move" },
    { atMs: 1600, target: "talent-score", action: "hover" },
    { atMs: 2800, target: "talent-interested", action: "click" },
  ],
  mingleMoment: [
    { atMs: 900, target: "mingle-cta", action: "move" },
    { atMs: 2200, target: "mingle-cta", action: "click" },
  ],
  conversation: [
    { atMs: 500, target: "chat-thread", action: "move" },
    { atMs: 1800, target: "chat-context", action: "hover" },
    { atMs: 3200, target: "chat-composer", action: "move" },
  ],
  recommendations: [
    { atMs: 400, target: "rec-first", action: "move" },
    { atMs: 1800, target: "rec-stars", action: "hover" },
  ],
  board: [
    { atMs: 400, target: "board-conversation", action: "move" },
    { atMs: 1800, target: "board-interview", action: "click" },
  ],
  darkMode: [
    { atMs: 300, target: "theme-toggle", action: "move" },
    { atMs: 900, target: "theme-toggle", action: "click" },
  ],
  phase2: [
    { atMs: 500, target: "phase2-lifecycle", action: "move" },
    { atMs: 1800, target: "phase2-automation", action: "move" },
    { atMs: 3000, target: "phase2-mobile", action: "hover" },
  ],
};
