import type { MatchReport } from "@/lib/matching/report";
import type { MatchFactor } from "@/lib/matching/engine";
import type { SubmittedRecommendation } from "@/lib/recommendations/persistence";
import type { CandidateRow } from "@/components/dashboard/CompanyDashboard";
import type { CompanyFunnel } from "@/lib/dashboard/funnel";
import type { ProfileDetailSection } from "@/components/profile-detail/ProfileDetailShell";
import type { RelationshipEventRow } from "@/lib/relationship/persistence";
import type { MessageRow } from "@/lib/messaging/persistence";

/** Stable fictional IDs — never written to production. */
export const DEMO_IDS = {
  companyUser: "demo-company-northstar",
  company: "demo-northstar-labs",
  role: "demo-role-senior-product-manager",
  emma: "demo-talent-emma-carter",
  daniel: "demo-talent-daniel-cohen",
  connection: "demo-connection-daniel-northstar",
  conversation: "demo-conversation-daniel-northstar",
} as const;

export const DEMO_COMPANY = {
  name: "Northstar Labs",
  subtitle: "Series B · Product hiring",
  initials: "NL",
  location: "London · Hybrid",
  industry: "B2B SaaS",
  stage: "Series B",
  size: "120–200 employees",
  culture: ["Fast-moving", "Ownership-driven", "Clarity", "Craft"],
} as const;

export const DEMO_ROLE = {
  title: "Senior Product Manager",
  department: "Product",
  seniority: "Senior",
  employment: "Full-time",
  workModel: ["Hybrid"],
  requiredSkills: [
    "Product strategy",
    "Analytics",
    "Stakeholder management",
    "Roadmapping",
    "User research",
  ],
  whatMatters: [
    "Build and scale products with clear ownership",
    "Collaborative and autonomous work style",
    "Comfortable in a fast-moving, ownership-driven culture",
  ],
  goals: ["Build and scale products"],
  workStyle: ["Collaborative", "Autonomous"],
  expectations: ["Hybrid", "Competitive compensation"],
  culture: ["Fast-moving", "Ownership-driven"],
  summary:
    "Own a core product surface end-to-end. Partner with design and engineering to ship clarity — from discovery through measurable outcomes.",
} as const;

export const DEMO_EMMA = {
  name: "Emma Carter",
  initials: "EC",
  headline: "Senior Product Designer",
  location: "Berlin · Open to EU remote",
  photo: "/landing/avatars/avatar-sofia.png",
  gender: "female" as const,
  about:
    "I design product systems that help teams move faster without losing craft.",
  skills: ["Product design", "Figma", "Design systems", "User research"],
  experience: "7 years · B2B SaaS",
  values: ["Craft", "Clarity", "Ownership"],
  goals: ["Lead design on a product with real users"],
  workStyle: ["Async-first", "Collaborative critique"],
  lookingFor: ["Product-led companies"],
} as const;

/** Hero talent for the cinematic product film. */
export const DEMO_DANIEL = {
  name: "Daniel Cohen",
  initials: "DC",
  headline: "Product Manager",
  location: "Tel Aviv · Open to hybrid EU",
  photo: "/landing/avatars/avatar-noah.png",
  gender: "male" as const,
  matchScore: 92,
  about:
    "I build product systems that turn messy discovery into clear bets. Most recently owned activation for a B2B platform used by 18k weekly teams.",
  skills: [
    "Product strategy",
    "Analytics",
    "Stakeholder management",
    "Roadmapping",
    "User interviews",
    "Experiment design",
  ],
  experience: "6 years · B2B SaaS & marketplace",
  values: ["Impact", "Clarity", "Ownership", "Honest feedback"],
  goals: [
    "Own a product surface end-to-end",
    "Grow into senior PM leadership",
  ],
  workStyle: ["Collaborative", "Autonomous", "Deep-work mornings"],
  lookingFor: [
    "Product-led Series B teams",
    "Clear ownership with strong design partners",
    "Hybrid with intentional office time",
  ],
  salary: "$140k–$165k",
  motivation:
    "I want to ship products where strategy, craft and outcomes stay connected — not buried in status decks.",
} as const;

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

const hoursAgo = (n: number) =>
  new Date(Date.now() - n * 3_600_000).toISOString();

export const DEMO_CANDIDATES: CandidateRow[] = [
  {
    userId: DEMO_IDS.daniel,
    name: DEMO_DANIEL.name,
    headline: DEMO_DANIEL.headline,
    location: DEMO_DANIEL.location,
    matchScore: 92,
    updatedAt: daysAgo(1),
    initials: DEMO_DANIEL.initials,
    gender: DEMO_DANIEL.gender,
    photo: DEMO_DANIEL.photo,
  },
  {
    userId: DEMO_IDS.emma,
    name: DEMO_EMMA.name,
    headline: DEMO_EMMA.headline,
    location: DEMO_EMMA.location,
    matchScore: 84,
    updatedAt: daysAgo(2),
    initials: DEMO_EMMA.initials,
    gender: DEMO_EMMA.gender,
    photo: DEMO_EMMA.photo,
  },
  {
    userId: "demo-talent-sofia-reyes",
    name: "Sofia Reyes",
    headline: "Product Manager",
    location: "Madrid · Hybrid",
    matchScore: 79,
    updatedAt: daysAgo(3),
    initials: "SR",
    gender: "female",
    photo: "/landing/avatars/avatar-maya.png",
  },
  {
    userId: "demo-talent-noah-kim",
    name: "Noah Kim",
    headline: "Senior Product Manager",
    location: "Amsterdam · Remote",
    matchScore: 76,
    updatedAt: daysAgo(4),
    initials: "NK",
    gender: "male",
    photo: "/landing/avatars/avatar-noah.png",
  },
  {
    userId: "demo-talent-aya-ben",
    name: "Aya Ben-David",
    headline: "Associate Product Manager",
    location: "London · Onsite preferred",
    matchScore: 71,
    updatedAt: daysAgo(5),
    initials: "AB",
    gender: "female",
    photo: "/landing/avatars/avatar-sofia.png",
  },
];

export const DEMO_FUNNEL: CompanyFunnel = {
  total: 247,
  counts: {
    connected: 18,
    exploring: 42,
    in_conversation: 11,
    interview_booked: 4,
    opportunity: 2,
    decision: 1,
    relationship: 0,
  },
};

export const DEMO_EMMA_MATCH_REPORT: MatchReport = {
  overall: 92,
  strength: "Strong match",
  confidence: "High",
  audience: "company",
  whatMattersMost:
    "Role skills, shared ownership culture, and aligned career goals around building and scaling products.",
  axes: [
    { id: "role", label: "Role Fit", score: 92 },
    { id: "company", label: "Human Fit", score: 87 },
    { id: "motivation", label: "Motivation Fit", score: 94 },
  ],
  why: [
    {
      key: "experience",
      label: "Strong experience alignment",
      finding: "Six years owning B2B product surfaces with measurable activation outcomes.",
    },
    {
      key: "workStyle",
      label: "Shared work preferences",
      finding: "Collaborative and autonomous — matches how Northstar ships.",
    },
    {
      key: "careerGoals",
      label: "Relevant career goals",
      finding: "Looking to own a product end-to-end at a Series B pace.",
    },
    {
      key: "skills",
      label: "Skills",
      finding: "Product strategy, analytics and stakeholder management overlap strongly.",
    },
    {
      key: "motivations",
      label: "Values",
      finding: "Impact, clarity and ownership show up on both sides.",
    },
  ],
  mismatch: [
    {
      key: "experience",
      label: "Compensation expectations",
      finding: "Candidate: $140k–$165k · Role band slightly lower — worth confirming.",
    },
    {
      key: "location",
      label: "Location / office expectations",
      finding: "Candidate prefers intentional hybrid; role is primarily London hybrid.",
    },
    {
      key: "experience",
      label: "Experience gap",
      finding: "Role asks for 7+ years; Daniel has 6 with strong ownership signal.",
    },
  ],
  technicalSignal: null,
  salaryGapPercent: 8,
};

export const DEMO_EMMA_SECTIONS: ProfileDetailSection[] = [
  {
    title: "About",
    text: DEMO_DANIEL.about,
  },
  {
    title: "Skills",
    chips: [...DEMO_DANIEL.skills],
  },
  {
    title: "Experience",
    text: DEMO_DANIEL.experience,
  },
  {
    title: "Values that drive me",
    chips: [...DEMO_DANIEL.values],
  },
  {
    title: "Career goals",
    chips: [...DEMO_DANIEL.goals],
  },
  {
    title: "How I work best",
    chips: [...DEMO_DANIEL.workStyle],
  },
  {
    title: "What I'm looking for",
    chips: [...DEMO_DANIEL.lookingFor],
  },
];

export const DEMO_WHAT_TO_EXPLORE = [
  "Compensation expectations and role band alignment",
  "Hybrid rhythm — intentional office days vs fully remote weeks",
  "How Daniel runs discovery with design before committing to a roadmap bet",
];

export const DEMO_RECOMMENDATIONS: SubmittedRecommendation[] = [
  {
    id: "demo-rec-1",
    rating: 5,
    recommenderName: "Priya Shah",
    body: "Daniel turns ambiguous product problems into clear bets. Engineers trust his prioritization, and he never loses the user in the process.",
  },
  {
    id: "demo-rec-2",
    rating: 5,
    recommenderName: "Marcus Chen",
    body: "One of the strongest product partners I've worked with. Decisive in critique, thoughtful with research, consistently focused on outcomes.",
  },
];

export const DEMO_ALIGNED_FACTORS: MatchFactor[] = [
  {
    key: "skills",
    label: "Skills",
    weight: 16,
    fraction: 0.92,
    verdict: "aligned",
    detail: "Strong overlap on strategy, analytics and stakeholder work.",
  },
  {
    key: "motivations",
    label: "Values",
    weight: 17,
    fraction: 0.9,
    verdict: "aligned",
    detail: "Impact, clarity and ownership show up on both sides.",
  },
  {
    key: "careerGoals",
    label: "Career goals",
    weight: 17,
    fraction: 0.88,
    verdict: "aligned",
    detail: "Senior ownership on a growing product surface.",
  },
];

export const DEMO_EXPLORE_FACTORS: MatchFactor[] = [
  {
    key: "location",
    label: "Location",
    weight: 7,
    fraction: 0.45,
    verdict: "partial",
    detail: "Worth confirming hybrid vs office-day expectations.",
  },
];

export const DEMO_TIMELINE: RelationshipEventRow[] = [
  {
    id: "demo-ev-1",
    connection_id: DEMO_IDS.connection,
    stage: "connected",
    actor_id: DEMO_IDS.companyUser,
    metadata: {},
    created_at: daysAgo(5),
  },
  {
    id: "demo-ev-2",
    connection_id: DEMO_IDS.connection,
    stage: "exploring",
    actor_id: DEMO_IDS.companyUser,
    metadata: {},
    created_at: daysAgo(4),
  },
  {
    id: "demo-ev-3",
    connection_id: DEMO_IDS.connection,
    stage: "in_conversation",
    actor_id: DEMO_IDS.daniel,
    metadata: {},
    created_at: daysAgo(2),
  },
  {
    id: "demo-ev-4",
    connection_id: DEMO_IDS.connection,
    stage: "interview_booked",
    actor_id: DEMO_IDS.companyUser,
    metadata: { note: "Product deep-dive" },
    created_at: hoursAgo(6),
  },
];

export const DEMO_MESSAGES: MessageRow[] = [
  {
    id: "demo-msg-1",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.companyUser,
    body: "Hi Daniel — your profile stood out beyond the CV. We'd love to learn how you turn discovery into clear product bets on complex B2B surfaces.",
    created_at: daysAgo(2),
    read_at: daysAgo(2),
  },
  {
    id: "demo-msg-2",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.daniel,
    body: "Thanks! Happy to share. I usually start with a lightweight problem brief, then a short research loop before we commit to a direction. Curious how Northstar balances ownership with shipping pace.",
    created_at: daysAgo(2),
    read_at: daysAgo(2),
  },
  {
    id: "demo-msg-3",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.companyUser,
    body: "That's exactly the tension we care about. Would you be open to a 45-minute product conversation this week?",
    created_at: hoursAgo(20),
    read_at: hoursAgo(18),
  },
  {
    id: "demo-msg-4",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.daniel,
    body: "Yes — Thursday afternoon works well for me. Looking forward to it.",
    created_at: hoursAgo(12),
    read_at: hoursAgo(10),
  },
];

/** Companies Emma might discover from the talent side. */
export const DEMO_TALENT_COMPANIES = [
  {
    userId: DEMO_IDS.companyUser,
    companyName: DEMO_COMPANY.name,
    mission: "Building clarity into B2B product workflows.",
    industry: DEMO_COMPANY.industry,
    location: DEMO_COMPANY.location,
    matchScore: 92,
    roleTitle: DEMO_ROLE.title,
    tags: [...DEMO_COMPANY.culture],
    about:
      "Series B product team looking for a senior designer who owns end-to-end surfaces with PMs and engineers.",
  },
  {
    userId: "demo-company-harbor",
    companyName: "Harbor Systems",
    mission: "Infrastructure that stays quiet until it matters.",
    industry: "Developer tools",
    location: "Remote · EU",
    matchScore: 84,
    roleTitle: "Product Designer",
    tags: ["Autonomy", "Craft", "Async"],
    about: "Small design pod partnering closely with platform engineering.",
  },
] as const;

export const DEMO_BOARD_COLUMNS = [
  {
    id: "connected",
    label: "Connected",
    accent: "var(--mingle-accent-pink)",
    names: ["Sofia Reyes"],
  },
  {
    id: "exploring",
    label: "Exploring",
    accent: "var(--mingle-accent-purple)",
    names: ["Daniel Cohen"],
  },
  {
    id: "in_conversation",
    label: "In conversation",
    accent: "var(--mingle-accent-blue)",
    names: ["Daniel Cohen"],
  },
  {
    id: "interview_booked",
    label: "Interview booked",
    accent: "var(--mingle-success)",
    names: ["Daniel Cohen"],
  },
] as const;

/**
 * Clearly labeled future roadmap — not shipped product.
 * Shown only as Phase 2 vision for investors.
 */
export const DEMO_PHASE2 = {
  eyebrow: "Phase 2 · Roadmap",
  title: "After the first pilot",
  lead: "The relationship layer expands beyond hiring into ongoing work — still human-first.",
  pillars: [
    {
      title: "Employee lifecycle",
      body: "Extend mingle from hire into the working relationship — onboarding context, check-ins, and continuity between people and companies.",
    },
    {
      title: "Process automation",
      body: "AI-assisted automation for employer–employee process forms and repetitive workflow paperwork — with humans still in control.",
    },
    {
      title: "Mobile for both sides",
      body: "Native apps so talent and recruiters can stay updated around the clock — conversations, interviews, and relationship stages on the go.",
    },
  ],
  note: "Vision for Phase 2 — not part of the current pilot build.",
} as const;

/**
 * Full investor voiceover — record separately, then lay over a clean
 * screen capture. Target runtime ~85–90s.
 */
export const DEMO_VOICEOVER = `Today, recruiters can go through hundreds of applications, but a CV only tells you part of the story.

With mingle, we look beyond the CV — understanding what the person brings, what they’re looking for, and how they want to work.

The company does the same — it tells us what it actually needs from the person and the role.

Then we bring both sides together and look at the match across role fit, human fit and motivation.

And this is one of the parts I care most about. We don’t just give you a score. We explain why the match exists — and where both sides should look closer.

The goal isn’t to replace the conversation. It’s to make the conversation start from a much better place.`;
