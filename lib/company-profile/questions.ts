export type CompanyMultiQuestion = {
  key: "workEnvironment" | "values" | "lookingFor";
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
    subtext: "Team culture and leadership style.",
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
    ],
  },
  {
    key: "values",
    headline: "What you value",
    subtext: "The culture you offer.",
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
    ],
  },
  {
    key: "lookingFor",
    headline: "What you're looking for",
    subtext: "The kind of talent and roles you're hiring for.",
    options: [
      "Product roles",
      "Engineering roles",
      "Design roles",
      "Data roles",
      "Sales roles",
      "Marketing roles",
      "Operations roles",
      "Leadership roles",
      "Early career talent",
      "Senior specialists",
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
