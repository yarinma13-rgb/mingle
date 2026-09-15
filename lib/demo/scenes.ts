export type DemoSceneId =
  | "opening"
  | "problem"
  | "introduce"
  | "company"
  | "profile"
  | "match"
  | "talent"
  | "mingleMoment"
  | "conversation"
  | "recommendations"
  | "board"
  | "darkMode"
  | "phase2"
  | "closing";

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
 * Faster pacing (~80–90s) covering company + talent sides, mingle moment,
 * dark mode flash, and a clearly labeled Phase 2 roadmap beat.
 */
export const DEMO_SCENES: DemoSceneConfig[] = [
  {
    id: "opening",
    durationMs: 4000,
    captions: [{ lines: ["Meet mingle.", "Beyond the match."] }],
  },
  {
    id: "problem",
    durationMs: 5000,
    captions: [
      { lines: ["Hiring is more than matching keywords."] },
      {
        atMs: 2200,
        lines: ["Skills matter.", "So do people, values, and fit."],
      },
    ],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Roles",
    audience: "company",
  },
  {
    id: "introduce",
    durationMs: 5600,
    captions: [
      { lines: ["A better way to connect talent and companies."] },
      { atMs: 2400, lines: ["Meet mingle."] },
    ],
    showChrome: true,
    chromeNav: "Dashboard",
    chromeTitle: "Dashboard",
    audience: "company",
  },
  {
    id: "company",
    durationMs: 6500,
    captions: [
      { lines: ["Start with what matters."] },
      { atMs: 2500, lines: ["Define the opportunity."] },
    ],
    showChrome: true,
    chromeNav: "Roles",
    chromeTitle: "Open role",
    audience: "company",
  },
  {
    id: "profile",
    durationMs: 5500,
    captions: [
      { lines: ["Go beyond the CV."] },
      { atMs: 2500, lines: ["Discover the person behind the profile."] },
    ],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Candidate profile",
    audience: "company",
  },
  {
    id: "match",
    durationMs: 5500,
    captions: [{ lines: ["More context.", "Better connections."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Match report",
    audience: "company",
  },
  {
    id: "talent",
    durationMs: 5500,
    captions: [
      { lines: ["Talent discovers companies too."] },
      { atMs: 2400, lines: ["Look beyond the keywords."] },
    ],
    showChrome: true,
    chromeNav: "Discover",
    chromeTitle: "Discover",
    audience: "talent",
  },
  {
    id: "mingleMoment",
    durationMs: 5500,
    captions: [{ lines: ["Mutual interest.", "It's a mingle."] }],
    fullBleed: true,
  },
  {
    id: "conversation",
    durationMs: 7200,
    captions: [
      { lines: ["Start a meaningful conversation."] },
      { atMs: 2800, lines: ["Type what matters — then send."] },
    ],
    showChrome: true,
    chromeNav: "Conversations",
    chromeTitle: "Conversation",
    audience: "company",
  },
  {
    id: "recommendations",
    durationMs: 4000,
    captions: [{ lines: ["Context you can trust."] }],
    showChrome: true,
    chromeNav: "Candidates",
    chromeTitle: "Recommendations",
    audience: "company",
  },
  {
    id: "board",
    durationMs: 4500,
    captions: [{ lines: ["Follow the relationship,", "not just the resume."] }],
    showChrome: true,
    chromeNav: "Board",
    chromeTitle: "Board",
    audience: "company",
  },
  {
    id: "darkMode",
    durationMs: 2500,
    captions: [{ lines: ["Light or dark — same product."] }],
    showChrome: true,
    chromeNav: "Dashboard",
    chromeTitle: "Dashboard",
    audience: "company",
    forceDark: true,
  },
  {
    id: "phase2",
    durationMs: 5500,
    captions: [
      { lines: ["Phase 2 — where mingle goes next."] },
      {
        atMs: 2400,
        lines: ["Employee lifecycle.", "Mobile for talent and recruiters."],
      },
    ],
  },
  {
    id: "closing",
    durationMs: 6000,
    captions: [
      {
        lines: [
          "Building a better way to connect talent and companies.",
        ],
      },
      {
        atMs: 2400,
        lines: ["Now entering the first pilot stage."],
      },
      {
        atMs: 4200,
        lines: ["mingle — Beyond the match.", "mingle.careers"],
      },
    ],
  },
];

export const DEMO_TOTAL_MS = DEMO_SCENES.reduce(
  (sum, scene) => sum + scene.durationMs,
  0,
);
