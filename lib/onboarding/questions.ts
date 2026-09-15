export const ONBOARDING_INTRO = {
  talent: {
    eyebrow: "Your profile",
    headline: "Let's get to know you",
    subtext: "Two sharp signals — skip anything that can wait.",
  },
  company: {
    eyebrow: "Company profile",
    headline: "Let's find the right people",
    subtext: "Two sharp signals that actually feed matching — skip what can wait.",
  },
} as const;

export type OnboardingQuestion = {
  key: "q1" | "q2" | "q3";
  question: string;
  type: "single" | "multi";
  options: string[];
  /** Non-essential steps can be skipped without inventing new IA. */
  optional?: boolean;
};

/**
 * Compressed preference flow.
 * Talent: required intent (q1) + optional company types (q3) — q3 feeds stage fit.
 * Company: required intent (q1) + optional hiring priorities (q2) — q2 feeds
 * culture_priorities (including Experience) so the experience weight is real.
 * Skipped banks stay available for future prompts.
 */
export const TALENT_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "q1",
    question: "What are you looking for right now?",
    type: "single",
    options: [
      "Full time opportunity",
      "Part time opportunity",
      "Freelance or contract",
      "Open to conversations",
      "Exploring what's next",
    ],
  },
  {
    key: "q2",
    question: "What matters most in your next chapter?",
    type: "multi",
    optional: true,
    options: [
      "Growth & learning",
      "Compensation",
      "Meaningful impact",
      "Strong leadership",
      "Flexibility & balance",
      "Ownership",
      "Stability",
      "Great team",
      "Mission-driven work",
      "Craft excellence",
    ],
  },
  {
    key: "q3",
    question: "What type of companies interest you?",
    type: "multi",
    optional: true,
    options: [
      "Startup",
      "Scale up",
      "Established company",
      "Enterprise",
      "Agency / consultancy",
      "Product studio",
      "Nonprofit / public sector",
      "Remote first",
      "Local company",
      "International company",
      "High growth",
      "Open to anything",
    ],
  },
];

export const COMPANY_QUESTIONS: OnboardingQuestion[] = [
  {
    key: "q1",
    question: "What are you looking to connect about?",
    type: "single",
    options: [
      "Hiring now",
      "Hiring soon",
      "Building a talent pipeline",
      "Exploring the market",
      "Networking with talent",
    ],
  },
  {
    key: "q2",
    question: "When you evaluate talent, what matters most?",
    type: "multi",
    optional: true,
    options: [
      "Experience",
      "Skills & craft",
      "Potential & learning speed",
      "Culture fit",
      "Ownership",
      "Domain expertise",
      "Communication",
      "Leadership",
      "Reliability",
      "Motivation",
    ],
  },
  {
    key: "q3",
    question: "Which domains are you hiring into?",
    type: "multi",
    optional: true,
    options: [
      "Technology",
      "Product",
      "Design",
      "Data",
      "Sales",
      "Marketing",
      "Growth",
      "Customer success",
      "Operations",
      "Finance",
      "HR / People",
      "Legal",
      "Construction",
      "Infrastructure",
      "Building supervision",
      "Research",
      "Leadership",
      "Other",
    ],
  },
];

/**
 * Active flows only return questions that matter for matching.
 * Talent: q1 + q3 (company types → stage fit).
 * Company: q1 + q2 (hiring priorities → culture_priorities / Experience).
 */
export function questionsForType(type: "talent" | "company") {
  if (type === "company") {
    return [COMPANY_QUESTIONS[0], COMPANY_QUESTIONS[1]];
  }
  return [TALENT_QUESTIONS[0], TALENT_QUESTIONS[2]];
}

export function introForType(type: "talent" | "company") {
  return ONBOARDING_INTRO[type];
}
