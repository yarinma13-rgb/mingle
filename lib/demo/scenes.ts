export type DemoSceneId =
  | "opening"
  | "problem"
  | "introduce"
  | "company"
  | "profile"
  | "match"
  | "mingleMoment"
  | "conversation"
  | "recommendations"
  | "closing"
  | "talent"
  | "board"
  | "darkMode"
  | "phase2";

export type DemoCaption = {
  lines: string[];
  /** When within the scene the caption appears (ms). */
  atMs?: number;
};

export type DemoAudience = "company" | "talent";

export type DemoSceneConfig = {
  id: DemoSceneId;
  /** Approximate duration for autoplay (ms). */
  durationMs: number;
  captions: DemoCaption[];
  showChrome?: boolean;
  chromeNav?: string;
  chromeTitle?: string;
  audience?: DemoAudience;
  forceDark?: boolean;
  fullBleed?: boolean;
};

/**
 * Investor demo v2 — ~88s cinematic product walkthrough.
 * Real mingle UI surfaces, marketing-grade captions, guided cursor + typing.
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: 5500,
    captions: [{ lines: ["Meet mingle.", "Beyond the match."] }],
  },
  {
    id: "problem",
    durationMs: 8000,
    captions: [
      { lines: ["Hiring is more than matching keywords."] },
      {
        atMs: 3200,
        lines: ["Skills matter.", "So do people, values, goals and fit."],
      },
    ],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Roles",
    audience: "company",
  },
  {
    id: "introduce",
    durationMs: 8000,
    captions: [
      { lines: ["A better way to connect", "talent and companies."] },
      {
        atMs: 3800,
        lines: ["More context from the very beginning."],
      },
    ],
    showChrome: true,
    chromeNav: "Dashboard",
    chromeTitle: "Dashboard",
    audience: "company",
  },
  {
    id: "company",
    durationMs: 7000,
    captions: [
      { lines: ["Define the opportunity."] },
      {
        atMs: 3200,
        lines: ["Then see who fits — beyond keywords."],
      },
    ],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Open role",
    audience: "company",
  },
  {
    id: "profile",
    durationMs: 12000,
    captions: [
      { lines: ["Go beyond the CV."] },
      {
        atMs: 4200,
        lines: ["Discover the person behind the profile."],
      },
      {
        atMs: 8000,
        lines: ["Experience, goals, values, expectations."],
      },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
    audience: "company",
  },
  {
    id: "match",
    durationMs: 11000,
    captions: [
      { lines: ["More context.", "Better connections."] },
      {
        atMs: 4500,
        lines: ["Role Fit. Human Fit. Motivation Fit."],
      },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Match report",
    audience: "company",
  },
  {
    id: "mingleMoment",
    durationMs: 4800,
    captions: [{ lines: ["Mutual interest.", "It's a mingle."] }],
    fullBleed: true,
  },
  {
    id: "conversation",
    durationMs: 14000,
    captions: [
      { lines: ["Start a meaningful conversation."] },
      {
        atMs: 5500,
        lines: ["From matching to an actual relationship."],
      },
    ],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
    audience: "company",
  },
  {
    id: "recommendations",
    durationMs: 8500,
    captions: [
      { lines: ["Context you can trust."] },
      {
        atMs: 3800,
        lines: ["Recommendations that enrich the picture."],
      },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Recommendations",
    audience: "company",
  },
  {
    id: "closing",
    durationMs: 11000,
    captions: [
      {
        lines: [
          "The first working version of mingle",
          "is now ready for pilot.",
        ],
      },
      {
        atMs: 4800,
        lines: ["mingle", "Beyond the match."],
      },
    ],
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
