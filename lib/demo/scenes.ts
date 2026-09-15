export type DemoSceneId =
  | "opening"
  | "problem"
  | "company"
  | "profile"
  | "match"
  | "conversation"
  | "recommendations"
  | "closing";

export type DemoCaption = {
  lines: string[];
  /** When within the scene the caption appears (ms). */
  atMs?: number;
};

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
};

/**
 * Timed for a ~75–90s natural recording when autoplay runs end-to-end.
 * Manual next/prev still available for controlled screen recordings.
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: 5000,
    captions: [{ lines: ["Meet mingle.", "Beyond the match."] }],
  },
  {
    id: "problem",
    durationMs: 7000,
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
  },
  {
    id: "company",
    durationMs: 14000,
    captions: [
      { lines: ["A better way to connect talent and companies."] },
    ],
    showChrome: true,
    chromeNav: "Dashboard",
    chromeTitle: "Dashboard",
  },
  {
    id: "profile",
    durationMs: 12000,
    captions: [
      { lines: ["Go beyond the CV."] },
      {
        atMs: 4500,
        lines: ["Discover the person behind the profile."],
      },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
  },
  {
    id: "match",
    durationMs: 10000,
    captions: [{ lines: ["More context.", "Better connections."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Match report",
  },
  {
    id: "conversation",
    durationMs: 13000,
    captions: [{ lines: ["Start a meaningful conversation."] }],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
  },
  {
    id: "recommendations",
    durationMs: 9000,
    captions: [{ lines: ["Context you can trust."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Recommendations",
  },
  {
    id: "closing",
    durationMs: 8000,
    captions: [
      {
        lines: [
          "The first working version of mingle is now ready for pilot.",
        ],
      },
      {
        atMs: 3500,
        lines: ["mingle", "Beyond the match."],
      },
    ],
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
