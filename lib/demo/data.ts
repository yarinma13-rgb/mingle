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
  role: "demo-role-senior-product-designer",
  emma: "demo-talent-emma-carter",
  daniel: "demo-talent-daniel-morgan",
  connection: "demo-connection-emma-northstar",
  conversation: "demo-conversation-emma-northstar",
} as const;

export const DEMO_COMPANY = {
  name: "Northstar Labs",
  subtitle: "Series B · Product design hiring",
  initials: "NL",
  location: "London · Remote-friendly",
  industry: "B2B SaaS",
  stage: "Series B",
  culture: ["Clarity", "Craft", "Ownership", "Kind intensity"],
} as const;

export const DEMO_ROLE = {
  title: "Senior Product Designer",
  department: "Design",
  seniority: "Senior",
  employment: "Full-time",
  workModel: ["Hybrid", "Remote"],
  requiredSkills: [
    "Product design",
    "Figma",
    "User research",
    "Design systems",
    "Prototyping",
  ],
  whatMatters: [
    "Systems thinking",
    "Clear collaboration with PMs and engineers",
    "Comfortable owning end-to-end product surfaces",
  ],
  summary:
    "Own core product surfaces for a growing B2B platform. Partner closely with product and engineering — from discovery through polished delivery.",
} as const;

export const DEMO_EMMA = {
  name: "Emma Carter",
  initials: "EC",
  headline: "Senior Product Designer",
  location: "Berlin · Open to EU remote",
  photo: "/landing/avatars/avatar-sofia.png",
  gender: "female" as const,
  about:
    "I design product systems that help teams move faster without losing craft. Most recently led the redesign of an analytics workspace used by 40k weekly active users.",
  skills: [
    "Product design",
    "Figma",
    "Design systems",
    "User research",
    "Prototyping",
    "Workshop facilitation",
  ],
  experience: "7 years · B2B SaaS & marketplace",
  values: ["Craft", "Clarity", "Ownership", "Honest feedback"],
  goals: ["Lead design on a product with real users", "Grow into design leadership"],
  workStyle: ["Async-first", "Collaborative critique", "Deep work mornings"],
  lookingFor: [
    "Product-led companies",
    "Designers who partner with engineering",
    "Room to shape process, not only pixels",
  ],
} as const;

export const DEMO_DANIEL = {
  name: "Daniel Morgan",
  initials: "DM",
  headline: "Product Designer",
  location: "Austin · Hybrid",
  photo: "/landing/avatars/avatar-noah.png",
  gender: "male" as const,
  matchScore: 81,
} as const;

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString();

const hoursAgo = (n: number) =>
  new Date(Date.now() - n * 3_600_000).toISOString();

export const DEMO_CANDIDATES: CandidateRow[] = [
  {
    userId: DEMO_IDS.emma,
    name: DEMO_EMMA.name,
    headline: DEMO_EMMA.headline,
    location: DEMO_EMMA.location,
    matchScore: 92,
    updatedAt: daysAgo(1),
    initials: DEMO_EMMA.initials,
    gender: DEMO_EMMA.gender,
    photo: DEMO_EMMA.photo,
  },
  {
    userId: DEMO_IDS.daniel,
    name: DEMO_DANIEL.name,
    headline: DEMO_DANIEL.headline,
    location: DEMO_DANIEL.location,
    matchScore: DEMO_DANIEL.matchScore,
    updatedAt: daysAgo(2),
    initials: DEMO_DANIEL.initials,
    gender: DEMO_DANIEL.gender,
    photo: DEMO_DANIEL.photo,
  },
  {
    userId: "demo-talent-sofia-reyes",
    name: "Sofia Reyes",
    headline: "UX Designer",
    location: "Madrid · Remote",
    matchScore: 78,
    updatedAt: daysAgo(3),
    initials: "SR",
    gender: "female",
    photo: "/landing/avatars/avatar-maya.png",
  },
];

export const DEMO_FUNNEL: CompanyFunnel = {
  total: 5,
  counts: {
    connected: 1,
    exploring: 1,
    in_conversation: 2,
    interview_booked: 1,
    opportunity: 0,
    decision: 0,
    relationship: 0,
  },
};

export const DEMO_EMMA_MATCH_REPORT: MatchReport = {
  overall: 92,
  strength: "Strong fit",
  confidence: "High",
  audience: "company",
  whatMattersMost:
    "Role skills, shared values around craft and ownership, and aligned career goals.",
  axes: [
    { id: "role", label: "Role Fit", score: 94 },
    { id: "company", label: "Human Fit", score: 90 },
    { id: "motivation", label: "Motivation Fit", score: 91 },
  ],
  why: [
    {
      key: "skills",
      label: "Skills",
      finding: "Product design, Figma, research and systems overlap strongly with the role.",
    },
    {
      key: "motivations",
      label: "Values",
      finding: "Craft, clarity and ownership match what Northstar prioritizes.",
    },
    {
      key: "careerGoals",
      label: "Career goals",
      finding: "Looking to lead design on a real product — aligned with this senior seat.",
    },
    {
      key: "workStyle",
      label: "Work style",
      finding: "Async-first collaboration fits a distributed Series B team.",
    },
    {
      key: "experience",
      label: "Experience",
      finding: "Seven years in B2B SaaS with end-to-end product ownership.",
    },
  ],
  mismatch: [
    {
      key: "location",
      label: "Location",
      finding: "Berlin-based; role is hybrid London with strong remote flexibility.",
    },
  ],
  technicalSignal: null,
};

export const DEMO_EMMA_SECTIONS: ProfileDetailSection[] = [
  {
    title: "About",
    text: DEMO_EMMA.about,
  },
  {
    title: "Skills",
    chips: [...DEMO_EMMA.skills],
  },
  {
    title: "Experience",
    text: DEMO_EMMA.experience,
  },
  {
    title: "Values that drive me",
    chips: [...DEMO_EMMA.values],
  },
  {
    title: "Career goals",
    chips: [...DEMO_EMMA.goals],
  },
  {
    title: "How I work best",
    chips: [...DEMO_EMMA.workStyle],
  },
  {
    title: "What I'm looking for",
    chips: [...DEMO_EMMA.lookingFor],
  },
];

export const DEMO_WHAT_TO_EXPLORE = [
  "How Emma runs discovery with PMs before jumping into Figma",
  "Her experience scaling a design system across squads",
  "What 'kind intensity' looks like in her day-to-day collaboration",
];

export const DEMO_RECOMMENDATIONS: SubmittedRecommendation[] = [
  {
    id: "demo-rec-1",
    rating: 5,
    recommenderName: "Priya Shah",
    body: "Emma raises the quality bar without slowing the team down. She turns ambiguous product problems into clear design directions, and engineers trust her specs.",
  },
  {
    id: "demo-rec-2",
    rating: 5,
    recommenderName: "Marcus Chen",
    body: "One of the strongest design partners I've worked with. Thoughtful with research, decisive in critique, and consistently focused on the user and the business.",
  },
];

export const DEMO_ALIGNED_FACTORS: MatchFactor[] = [
  {
    key: "skills",
    label: "Skills",
    weight: 16,
    fraction: 0.92,
    verdict: "aligned",
    detail: "Strong overlap on product design, research and systems.",
  },
  {
    key: "motivations",
    label: "Values",
    weight: 17,
    fraction: 0.9,
    verdict: "aligned",
    detail: "Craft and ownership show up on both sides.",
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
    detail: "Worth confirming hybrid vs fully remote expectations.",
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
    actor_id: DEMO_IDS.emma,
    metadata: {},
    created_at: daysAgo(2),
  },
  {
    id: "demo-ev-4",
    connection_id: DEMO_IDS.connection,
    stage: "interview_booked",
    actor_id: DEMO_IDS.companyUser,
    metadata: { note: "Design deep-dive" },
    created_at: hoursAgo(6),
  },
];

export const DEMO_MESSAGES: MessageRow[] = [
  {
    id: "demo-msg-1",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.companyUser,
    body: "Hi Emma — your profile stood out beyond the portfolio. We'd love to learn how you run discovery with PMs on complex B2B surfaces.",
    created_at: daysAgo(2),
    read_at: daysAgo(2),
  },
  {
    id: "demo-msg-2",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.emma,
    body: "Thanks! Happy to share. I usually start with a lightweight problem brief, then a short research loop before we commit to a direction. Curious how Northstar balances craft with shipping pace.",
    created_at: daysAgo(2),
    read_at: daysAgo(2),
  },
  {
    id: "demo-msg-3",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.companyUser,
    body: "That's exactly the tension we care about. Would you be open to a 45-minute design conversation this week?",
    created_at: hoursAgo(20),
    read_at: hoursAgo(18),
  },
  {
    id: "demo-msg-4",
    conversation_id: DEMO_IDS.conversation,
    sender_id: DEMO_IDS.emma,
    body: "Yes — Thursday afternoon works well for me. Looking forward to it.",
    created_at: hoursAgo(12),
    read_at: hoursAgo(10),
  },
];

export const DEMO_VOICEOVER = `Hiring is more than matching keywords.

mingle helps companies and talent connect beyond the traditional hiring process — bringing together skills, values, goals and the human context behind the profile.

This is the first working version of mingle, now moving into our first pilot stage.

mingle. Beyond the match.`;
