/** Rules the product MAY auto-run (email / in-app). No ML. */

export type GrowthRuleId =
  | "finish_profile_24h"
  | "open_discover_24h"
  | "first_message_after_mingle";

export type GrowthRule = {
  id: GrowthRuleId;
  description: string;
  owner: "auto";
};

export const GROWTH_RULES: GrowthRule[] = [
  {
    id: "finish_profile_24h",
    description:
      "Signed up 24h+ ago, onboarding not complete → email nudge to finish profile",
    owner: "auto",
  },
  {
    id: "open_discover_24h",
    description:
      "Onboarding complete 24h+ ago, zero connections → email nudge to open Discover",
    owner: "auto",
  },
  {
    id: "first_message_after_mingle",
    description:
      "Accepted connection 24h+ ago, no messages → email nudge to start chat",
    owner: "auto",
  },
];
