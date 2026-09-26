import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoFocusBeat = {
  atMs: number;
  /** data-demo-target value */
  target: string;
  /** How long the highlight holds (ms). Default 900. */
  holdMs?: number;
};

/**
 * Cinematic focus path — soft spotlight within each 3.5s slide.
 */
export const DEMO_FOCUS_SCRIPT: Partial<Record<DemoSceneId, DemoFocusBeat[]>> = {
  problem: [
    { atMs: 1700, target: "problem-overlay-skills", holdMs: 800 },
    { atMs: 2700, target: "problem-overlay-rest", holdMs: 700 },
  ],
  profile: [
    { atMs: 1400, target: "profile-goals", holdMs: 700 },
    { atMs: 2100, target: "profile-work", holdMs: 600 },
    { atMs: 2800, target: "profile-motivation", holdMs: 600 },
  ],
  company: [
    { atMs: 600, target: "role-skills", holdMs: 700 },
    { atMs: 1400, target: "role-goals", holdMs: 600 },
    { atMs: 2300, target: "mutual-bridge", holdMs: 1000 },
  ],
  match: [
    { atMs: 800, target: "fit-role", holdMs: 550 },
    { atMs: 1500, target: "fit-human", holdMs: 550 },
    { atMs: 2200, target: "fit-motivation", holdMs: 700 },
  ],
  mingleMoment: [
    { atMs: 500, target: "mingle-headline", holdMs: 1400 },
    { atMs: 2100, target: "mingle-cta", holdMs: 1000 },
  ],
  whyMatch: [
    { atMs: 500, target: "why-fits", holdMs: 1200 },
    { atMs: 2000, target: "what-explore", holdMs: 1300 },
  ],
  conversation: [
    { atMs: 300, target: "start-conversation", holdMs: 550 },
    { atMs: 1100, target: "chat-thread", holdMs: 900 },
  ],
};

export function activeFocusBeat(
  script: DemoFocusBeat[] | undefined,
  elapsedMs: number,
): DemoFocusBeat | null {
  if (!script?.length) return null;
  let current: DemoFocusBeat | null = null;
  for (const beat of script) {
    const hold = beat.holdMs ?? 900;
    if (elapsedMs >= beat.atMs && elapsedMs < beat.atMs + hold) {
      current = beat;
    }
  }
  return current;
}
