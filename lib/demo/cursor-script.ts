import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoCursorAction = "move" | "click" | "hover" | "type";

export type DemoCursorBeat = {
  atMs: number;
  target: string;
  action?: DemoCursorAction;
  /** Keep zoom ≤ 1.02 — focus highlight carries attention. */
  zoom?: number;
  typeText?: string;
};

/**
 * Calm guided cursor for the cinematic film — minimal zoom, purposeful clicks.
 */
export const DEMO_CURSOR_SCRIPT: Partial<Record<DemoSceneId, DemoCursorBeat[]>> =
  {
    problem: [
      { atMs: 1200, target: "problem-overlay-skills", action: "move", zoom: 1.01 },
    ],
    profile: [
      { atMs: 1000, target: "profile-avatar", action: "move", zoom: 1.01 },
      { atMs: 5000, target: "profile-goals", action: "hover", zoom: 1.01 },
      { atMs: 15000, target: "profile-motivation", action: "hover", zoom: 1.01 },
    ],
    company: [
      { atMs: 800, target: "role-title", action: "move", zoom: 1.01 },
      { atMs: 4000, target: "role-skills", action: "hover", zoom: 1.01 },
      { atMs: 17000, target: "mutual-bridge", action: "move", zoom: 1.01 },
    ],
    match: [
      { atMs: 600, target: "match-score", action: "move", zoom: 1.02 },
      { atMs: 4000, target: "fit-role", action: "hover", zoom: 1.01 },
      { atMs: 7000, target: "fit-human", action: "hover", zoom: 1.01 },
      { atMs: 10000, target: "fit-motivation", action: "hover", zoom: 1.01 },
    ],
    whyMatch: [
      { atMs: 2500, target: "why-fits", action: "move", zoom: 1.01 },
      { atMs: 13000, target: "what-explore", action: "hover", zoom: 1.01 },
    ],
    conversation: [
      { atMs: 1800, target: "start-conversation", action: "click", zoom: 1.01 },
      { atMs: 7000, target: "chat-thread", action: "move", zoom: 1.01 },
      {
        atMs: 11000,
        target: "chat-composer",
        action: "type",
        zoom: 1.01,
        typeText: "Looking forward to Thursday — I'll bring a few product examples.",
      },
      { atMs: 17000, target: "chat-send", action: "click", zoom: 1.01 },
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
