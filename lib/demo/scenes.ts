export type DemoSceneId =
  | "opening"
  | "problem"
  | "profile"
  | "company"
  | "match"
  | "mingleMoment"
  | "whyMatch"
  | "conversation"
  | "idea"
  | "closing"
  | "introduce"
  | "recommendations"
  | "talent"
  | "board"
  | "darkMode"
  | "phase2";

export type DemoCaption = {
  lines: string[];
  atMs?: number;
};

export type DemoAudience = "company" | "talent";

export type DemoSceneConfig = {
  id: DemoSceneId;
  /** Approximate duration for autoplay (ms). */
  durationMs: number;
  /** Empty for the cinematic film — no on-screen captions. */
  captions: DemoCaption[];
  showChrome?: boolean;
  chromeNav?: string;
  chromeTitle?: string;
  audience?: DemoAudience;
  forceDark?: boolean;
  fullBleed?: boolean;
};

const SLIDE_MS = 5500;

/**
 * Cinematic product film — 5.5s slides, no captions.
 * Talent + Company → Mutual Matching → Understand Why → Better Conversation
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: SLIDE_MS,
    captions: [],
    fullBleed: true,
  },
  {
    id: "problem",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Applicants",
    audience: "company",
  },
  {
    id: "profile",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
    audience: "company",
  },
  {
    id: "company",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Open role",
    audience: "company",
  },
  {
    id: "match",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Your Match",
    audience: "company",
  },
  {
    id: "mingleMoment",
    durationMs: SLIDE_MS,
    captions: [],
    fullBleed: true,
  },
  {
    id: "whyMatch",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Why this match",
    audience: "company",
  },
  {
    id: "conversation",
    durationMs: SLIDE_MS,
    captions: [],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
    audience: "company",
  },
  {
    id: "idea",
    durationMs: SLIDE_MS,
    captions: [],
    fullBleed: true,
  },
  {
    id: "closing",
    durationMs: SLIDE_MS,
    captions: [],
    fullBleed: true,
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
