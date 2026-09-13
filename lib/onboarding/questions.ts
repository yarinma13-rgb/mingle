export const ONBOARDING_INTRO = {
  talent: {
    eyebrow: "Your profile",
    headline: "Let's get to know you",
    subtext: "A few sharp signals — not a long form.",
  },
  company: {
    eyebrow: "Company profile",
    headline: "Let's find the right people",
    subtext:
      "Tell us what kind of talent and relationships you're looking to build.",
  },
} as const;

export type OnboardingQuestion = {
  key: "q1" | "q2" | "q3";
  question: string;
  type: "single" | "multi";
  options: string[];
};

/**
 * Talent preference questions. Values are curated to avoid near-duplicates
 * (e.g. Growth vs Career development) while keeping match signal.
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
      "Hiring",
      "Future hiring",
      "Talent discovery",
      "Networking",
      "Building a talent community",
      "Exploring partnerships",
    ],
  },
  {
    key: "q2",
    question: "What matters most when meeting great talent?",
    type: "multi",
    options: [
      "Skills",
      "Experience",
      "Culture fit",
      "Potential",
      "Motivation",
      "Values",
      "Communication",
      "Leadership",
      "Industry expertise",
      "Ownership",
      "Learning speed",
      "Craft",
      "Reliability",
      "Collaboration",
      "Ambition",
      "Domain depth",
      "Coachability",
      "Clarity",
    ],
  },
  {
    key: "q3",
    question: "What type of talent are you interested in?",
    type: "multi",
    options: [
      "Technology",
      "Sales",
      "Marketing",
      "Customer success",
      "Operations",
      "Finance",
      "HR",
      "Management",
      "Other",
      "Product",
      "Design",
      "Data",
      "Legal",
      "Support",
      "Research",
      "People ops",
      "Growth",
      "Founders",
    ],
  },
];

export function questionsForType(type: "talent" | "company") {
  return type === "company" ? COMPANY_QUESTIONS : TALENT_QUESTIONS;
}

export function introForType(type: "talent" | "company") {
  return ONBOARDING_INTRO[type];
}
