export type CompanyMultiQuestion = {
  key: "workEnvironment" | "values";
  headline: string;
  subtext: string;
  options: string[];
};

// Options per PRODUCT_SPEC.md sections 21 and 43 — mirrors the talent
// profile's depth: how we work, what we value, what we're looking for.
export const COMPANY_QUESTIONS: CompanyMultiQuestion[] = [
  {
    key: "workEnvironment",
    headline: "How you work",
    subtext: "Team culture and day-to-day style.",
    options: [
      "Fast paced",
      "Structured",
      "Flexible",
      "Remote friendly",
      "Office based",
      "Hybrid",
      "Data driven",
      "Autonomous",
      "Collaborative",
      "Ownership driven",
      "Mentorship heavy",
      "Quiet focus",
      "Customer facing",
      "Experiment first",
      "Process first",
      "Async by default",
      "High ownership",
      "Cross functional",
    ],
  },
  {
    key: "values",
    headline: "What you value",
    subtext: "Culture signals we use for matching. Looking-for is filled from this.",
    options: [
      "Ownership",
      "Curiosity",
      "Transparency",
      "Learning",
      "Collaboration",
      "Excellence",
      "Integrity",
      "Diversity",
      "Innovation",
      "Impact",
      "Kindness",
      "Accountability",
      "Craft",
      "Speed",
      "Trust",
      "Inclusion",
      "Ambition",
      "Humility",
    ],
  },
];

export const COMPANY_STAGE_OPTIONS = [
  "Pre seed",
  "Seed",
  "Early stage",
  "Growth",
  "Scale up",
  "Established",
];

export const COMPANY_SIZE_OPTIONS = [
  "1 to 10",
  "11 to 50",
  "51 to 200",
  "201 to 500",
  "500 plus",
];
