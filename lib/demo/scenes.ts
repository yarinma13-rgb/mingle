export type DemoSceneId =
  | "opening"
  | "problem"
  | "profile"
  | "company"
  | "match"
  | "whyMatch"
  | "conversation"
  | "idea"
  | "closing"
  | "introduce"
  | "mingleMoment"
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

/**
 * Cinematic product film — ~3:00, no captions.
 * Talent + Company → Mutual Matching → Understand Why → Better Conversation
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: 12000,
    captions: [],
    fullBleed: true,
  },
  {
    id: "problem",
    durationMs: 23000,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Applicants",
    audience: "company",
  },
  {
    id: "profile",
    durationMs: 25000,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
    audience: "company",
  },
  {
    id: "company",
    durationMs: 25000,
    captions: [],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Open role",
    audience: "company",
  },
  {
    id: "match",
    durationMs: 25000,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Your Match",
    audience: "company",
  },
  {
    id: "whyMatch",
    durationMs: 30000,
    captions: [],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Why this match",
    audience: "company",
  },
  {
    id: "conversation",
    durationMs: 22000,
    captions: [],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
    audience: "company",
  },
  {
    id: "idea",
    durationMs: 10000,
    captions: [],
    fullBleed: true,
  },
  {
    id: "closing",
    durationMs: 8000,
    captions: [],
    fullBleed: true,
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
