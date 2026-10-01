import type { Metadata } from "next";
import { InvestorPitchShell } from "@/components/investors/InvestorPitchShell";

export const metadata: Metadata = {
  title: "Investor Brief | mingle",
  description:
    "mingle investor brief — folder-based pitch demos covering founder, problem, solution, market, competition, pricing, validation, roadmap and the ask.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InvestorsPage() {
  return <InvestorPitchShell />;
}
