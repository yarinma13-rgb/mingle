export type ProfileMultiQuestion = {
  key: "drives" | "workStyle" | "lookingFor";
  eyebrow: string;
  headline: string;
  subtext: string;
  options: string[];
};

// Options and copy per PRODUCT_SPEC.md screens 7, 8, and 9.
export const PROFILE_QUESTIONS: ProfileMultiQuestion[] = [
  {
    key: "drives",
    eyebrow: "What drives you",
    headline: "What drives you",
    subtext: "What motivates you in your career?",
    options: [
      "Growth",
      "Impact",
      "Learning",
      "Leadership",
      "Creativity",
      "Purpose",
      "Recognition",
      "Stability",
      "Autonomy",
      "Challenge",
    ],
  },
  {
    key: "workStyle",
    eyebrow: "How you work",
    headline: "How you work",
    subtext: "What kind of environment brings out your best?",
    options: [
      "Collaborative",
      "Independent",
      "Fast paced",
      "Structured",
      "Flexible",
      "Remote",
      "Office based",
      "Hybrid",
      "Creative",
      "Data driven",
    ],
  },
  {
    key: "lookingFor",
    eyebrow: "What you are looking for",
    headline: "What you're looking for",
    subtext: "What would make your next move meaningful?",
    options: [
      "Career growth",
      "Meaningful work",
      "Better leadership",
      "Higher compensation",
      "Flexibility",
      "New challenges",
      "Learning",
      "Culture",
      "Impact",
    ],
  },
];

export const BEYOND_CV_SUB_PROMPTS = [
  "What are you unusually good at?",
  "What problems do you love solving?",
  "What are you curious about?",
];
