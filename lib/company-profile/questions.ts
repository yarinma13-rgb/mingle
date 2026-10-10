export type CompanyMultiQuestion = {
  key: "workEnvironment" | "values";
  headline: string;
  subtext: string;
  options: string[];
};

/**
 * Aligned with talent PROFILE_QUESTIONS vocabulary where possible so
 * synonym overlap in matching is real, not accidental.
 * Values also fill looking_for (one step, no double ask).
 */
export const COMPANY_QUESTIONS: CompanyMultiQuestion[] = [
  {
    key: "workEnvironment",
    headline: "How your team works",
    subtext: "Day-to-day style talent will feel. Optional — skip if the role says it.",
    options: [
      "Collaborative",
      "Independent",
      "Fast paced",
      "Structured",
      "Flexible",
      "Remote",
      "Hybrid",
      "Office based",
      "Async",
      "Async by default",
      "High ownership",
      "Cross functional",
      "Mentorship heavy",
      "Quiet focus",
      "Customer facing",
      "Creative",
      "Data driven",
      "Hands on",
      "Strategic",
    ],
  },
  {
    key: "values",
    headline: "What you hire for",
    subtext:
      "Same vocabulary as talent drives — so match % is real, not decorative. Also becomes your “looking for” chips.",
    options: [
      "Growth & learning",
      "Meaningful impact",
      "Ownership",
      "Craft excellence",
      "Strong leadership",
      "Flexibility & balance",
      "Stability",
      "Great team & culture",
      "Mission-driven work",
      "Autonomy",
      "New challenges",
      "Collaboration",
      "Transparency",
      "Innovation",
      "Inclusion",
      "Accountability",
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
