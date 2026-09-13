export type ProfileMultiQuestion = {
  key: "drives" | "workStyle";
  eyebrow: string;
  headline: string;
  subtext: string;
  options: string[];
};

/**
 * Profile multi-selects. Drives + looking-for were nearly identical and
 * stacked fatigue before free-text — one curated values step keeps match
 * signal without the double ask. Picks still persist to both `drives` and
 * `looking_for` for matching compatibility.
 */
export const PROFILE_QUESTIONS: ProfileMultiQuestion[] = [
  {
    key: "drives",
    eyebrow: "What matters",
    headline: "What matters most to you?",
    subtext:
      "Pick the signals that best describe your next chapter — we’ll use them for matching.",
    options: [
      "Growth & learning",
      "Meaningful impact",
      "Compensation",
      "Strong leadership",
      "Flexibility & balance",
      "Ownership",
      "Stability",
      "Great team & culture",
      "Mission-driven work",
      "Craft excellence",
      "New challenges",
      "Autonomy",
    ],
  },
  {
    key: "workStyle",
    eyebrow: "How you work",
    headline: "How you do your best work",
    subtext: "What kind of environment brings out your best?",
    options: [
      "Collaborative",
      "Independent",
      "Fast paced",
      "Structured",
      "Flexible",
      "Remote",
      "Hybrid",
      "Office based",
      "Creative",
      "Data driven",
      "Quiet focus",
      "Hands on",
      "Strategic",
      "Async",
      "Maker time",
      "Manager time",
    ],
  },
];

export const BEYOND_CV_SUB_PROMPTS = [
  "What are you unusually good at?",
  "What problems do you love solving?",
  "What are you curious about?",
];
