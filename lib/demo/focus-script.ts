import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoFocusBeat = {
  atMs: number;
  /** data-demo-target value */
  target: string;
  /** How long the highlight holds (ms). Default 1100. */
  holdMs?: number;
};

/**
 * Cinematic focus path — soft spotlight within each 5.5s slide.
 */
export const DEMO_FOCUS_SCRIPT: Partial<Record<DemoSceneId, DemoFocusBeat[]>> = {
  problem: [
    { atMs: 2400, target: "problem-overlay-skills", holdMs: 1100 },
    { atMs: 3900, target: "problem-overlay-rest", holdMs: 1200 },
  ],
  profile: [
    { atMs: 2100, target: "profile-goals", holdMs: 1000 },
    { atMs: 3300, target: "profile-work", holdMs: 900 },
    { atMs: 4400, target: "profile-motivation", holdMs: 900 },
  ],
  company: [
    { atMs: 800, target: "role-skills", holdMs: 1000 },
    { atMs: 2000, target: "role-goals", holdMs: 900 },
    { atMs: 3500, target: "mutual-bridge", holdMs: 1500 },
  ],
  match: [
    { atMs: 1100, target: "fit-role", holdMs: 900 },
    { atMs: 2300, target: "fit-human", holdMs: 900 },
    { atMs: 3500, target: "fit-motivation", holdMs: 1100 },
  ],
  mingleMoment: [
    { atMs: 700, target: "mingle-headline", holdMs: 2000 },
    { atMs: 3200, target: "mingle-cta", holdMs: 1600 },
  ],
  whyMatch: [
    { atMs: 700, target: "why-fits", holdMs: 1800 },
    { atMs: 3100, target: "what-explore", holdMs: 2000 },
  ],
  conversation: [
    { atMs: 400, target: "start-conversation", holdMs: 900 },
    { atMs: 1600, target: "chat-thread", holdMs: 1400 },
  ],
};

export function activeFocusBeat(
  script: DemoFocusBeat[] | undefined,
  elapsedMs: number,
): DemoFocusBeat | null {
  if (!script?.length) return null;
  let current: DemoFocusBeat | null = null;
  for (const beat of script) {
    const hold = beat.holdMs ?? 1100;
    if (elapsedMs >= beat.atMs && elapsedMs < beat.atMs + hold) {
      current = beat;
    }
  }
  return current;
}
