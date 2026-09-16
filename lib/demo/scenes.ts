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
  // Kept for manual nav / chrome jumps (not in the investor autoplay path)
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
  /** Whether product chrome (sidebar) should show. */
  showChrome?: boolean;
  /** Active nav label highlighted in demo chrome. */
  chromeNav?: string;
  chromeTitle?: string;
  audience?: DemoAudience;
  /** Force dark theme for this scene only. */
  forceDark?: boolean;
  /** Full-bleed scene without chrome padding (e.g. mingle moment). */
  fullBleed?: boolean;
};

/**
 * Investor product demo (~75–80s) aligned to the agreed caption + voiceover
 * script: opening → problem → company path → beyond CV → match →
 * conversation (via mingle beat) → recommendations → closing.
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: 4800,
    captions: [{ lines: ["Meet mingle.", "Beyond the match."] }],
  },
  {
    id: "problem",
    durationMs: 6800,
    captions: [
      { lines: ["Hiring is more than matching keywords."] },
      {
        atMs: 2800,
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
    durationMs: 7000,
    captions: [
      { lines: ["A better way to connect talent and companies."] },
    ],
    showChrome: true,
    chromeNav: "Dashboard",
    chromeTitle: "Dashboard",
    audience: "company",
  },
  {
    id: "company",
    durationMs: 6000,
    captions: [
      { lines: ["A better way to connect talent and companies."] },
    ],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Open role",
    audience: "company",
  },
  {
    id: "profile",
    durationMs: 11000,
    captions: [
      { lines: ["Go beyond the CV."] },
      { atMs: 4500, lines: ["Discover the person behind the profile."] },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
    audience: "company",
  },
  {
    id: "match",
    durationMs: 10000,
    captions: [{ lines: ["More context.", "Better connections."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Match report",
    audience: "company",
  },
  {
    id: "mingleMoment",
    durationMs: 3800,
    captions: [],
    fullBleed: true,
  },
  {
    id: "conversation",
    durationMs: 13000,
    captions: [{ lines: ["Start a meaningful conversation."] }],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
    audience: "company",
  },
  {
    id: "recommendations",
    durationMs: 7500,
    captions: [{ lines: ["Context you can trust."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Recommendations",
    audience: "company",
  },
  {
    id: "closing",
    durationMs: 10000,
    captions: [
      {
        lines: [
          "The first working version of mingle",
          "is now ready for pilot.",
        ],
      },
      {
        atMs: 4200,
        lines: ["mingle", "Beyond the match."],
      },
    ],
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
