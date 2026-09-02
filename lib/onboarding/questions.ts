export const ONBOARDING_INTRO = {
  talent: {
    eyebrow: "Your profile",
    headline: "Let's get to know you",
    subtext: "Tell us what you're looking for, not just what you've done.",
  },
  company: {
    eyebrow: "Company profile",
    headline: "Let's find the right people",
    subtext: "Tell us what kind of talent and relationships you're looking to build.",
  },
} as const;

export type OnboardingQuestion = {
  key: "q1" | "q2" | "q3";
  question: string;
  type: "single" | "multi";
  options: string[];
};

// Copy and option sets ported from the validated prototype per BRIDGE.md —
// same shape, refined wording, already proven to read well across profiles.
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
    question: "What matters most to you in your next move?",
    type: "multi",
    options: [
      "Growth",
      "Compensation",
      "Company culture",
      "Flexibility",
      "Leadership",
      "Meaningful work",
      "Career development",
      "Work life balance",
      "Location",
      "Learning opportunities",
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
    ],
  },
];
