import type { DemoSceneId } from "@/lib/demo/scenes";

export type DemoFocusBeat = {
  atMs: number;
  /** data-demo-target value */
  target: string;
  /** How long the highlight holds (ms). Default 1600. */
  holdMs?: number;
};

/**
 * Cinematic focus path — soft spotlight on the UI the viewer should notice.
 * Prefer this over camera zoom for the product film.
 */
export const DEMO_FOCUS_SCRIPT: Partial<Record<DemoSceneId, DemoFocusBeat[]>> = {
  problem: [
    { atMs: 9000, target: "problem-overlay-skills", holdMs: 1800 },
    { atMs: 14000, target: "problem-overlay-rest", holdMs: 2000 },
  ],
  profile: [
    { atMs: 4500, target: "profile-goals", holdMs: 2000 },
    { atMs: 9000, target: "profile-work", holdMs: 2000 },
    { atMs: 14500, target: "profile-motivation", holdMs: 2200 },
  ],
  company: [
    { atMs: 3500, target: "role-skills", holdMs: 1800 },
    { atMs: 7500, target: "role-goals", holdMs: 1800 },
    { atMs: 11500, target: "role-work", holdMs: 1800 },
    { atMs: 16500, target: "mutual-bridge", holdMs: 2500 },
  ],
  match: [
    { atMs: 3500, target: "fit-role", holdMs: 1600 },
    { atMs: 6500, target: "fit-human", holdMs: 1600 },
    { atMs: 9500, target: "fit-motivation", holdMs: 1600 },
    { atMs: 15500, target: "mingle-celebration", holdMs: 1800 },
  ],
  whyMatch: [
    { atMs: 4000, target: "why-fits", holdMs: 2800 },
    { atMs: 14000, target: "what-explore", holdMs: 3200 },
  ],
  conversation: [
    { atMs: 2500, target: "start-conversation", holdMs: 1800 },
    { atMs: 9000, target: "chat-thread", holdMs: 2200 },
  ],
};

export function activeFocusBeat(
  script: DemoFocusBeat[] | undefined,
  elapsedMs: number,
): DemoFocusBeat | null {
  if (!script?.length) return null;
  let current: DemoFocusBeat | null = null;
  for (const beat of script) {
    const hold = beat.holdMs ?? 1600;
    if (elapsedMs >= beat.atMs && elapsedMs < beat.atMs + hold) {
      current = beat;
    }
  }
  return current;
}
