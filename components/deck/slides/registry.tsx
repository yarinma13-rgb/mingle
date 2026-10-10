"use client";

import type { DeckSlideDef } from "@/lib/deck/types";
import { OpeningSlide } from "@/components/deck/slides/OpeningSlide";
import { IdeaSlide } from "@/components/deck/slides/IdeaSlide";
import { ProblemSlide } from "@/components/deck/slides/ProblemSlide";
import { InsightSlide } from "@/components/deck/slides/InsightSlide";
import { SolutionSlide } from "@/components/deck/slides/SolutionSlide";
import { WhyMatchSlide } from "@/components/deck/slides/WhyMatchSlide";
import { ProductFlowSlide } from "@/components/deck/slides/ProductFlowSlide";
import { ProductSlide } from "@/components/deck/slides/ProductSlide";
import { CandidateSlide } from "@/components/deck/slides/CandidateSlide";
import { CompanySlide } from "@/components/deck/slides/CompanySlide";
import { InsightsSlide } from "@/components/deck/slides/InsightsSlide";
import { BusinessModelSlide } from "@/components/deck/slides/BusinessModelSlide";
import { OpportunitySlide } from "@/components/deck/slides/OpportunitySlide";
import { TractionSlide } from "@/components/deck/slides/TractionSlide";
import { FounderSlide } from "@/components/deck/slides/FounderSlide";
import { VisionSlide } from "@/components/deck/slides/VisionSlide";
import { ClosingSlide } from "@/components/deck/slides/ClosingSlide";
import {
  AppendixBusinessModelSlide,
  AppendixMatchingSlide,
  AppendixJourneysSlide,
  AppendixProductExtrasSlide,
  AppendixGtmSlide,
  AppendixRoadmapSlide,
  AppendixCompetitiveSlide,
  AppendixFounderSlide,
  AppendixQaSlide,
} from "@/components/deck/slides/AppendixSlides";

export const DECK_SLIDES: DeckSlideDef[] = [
  {
    id: "opening",
    section: "main",
    label: "פתיחה",
    notes:
      "לפתוח נקי. לוגו, Beyond the match, ומשפט אחד על Relationship layer. התמונה מציגה את המייסדת בלי להעמיס.",
    render: () => <OpeningSlide />,
  },
  {
    id: "idea",
    section: "main",
    label: "הרעיון",
    notes:
      "משפט אחד ברור: mingle היא שכבת הקשר לפני ההעסקה. להראות את הFlow People אל Employment.",
    render: () => <IdeaSlide />,
  },
  {
    id: "problem",
    section: "main",
    label: "הבעיה",
    notes:
      "ליצור מתח ויזואלי בין מה שרואים לפני הגיוס לבין מה שמתגלה אחרי. CV + Interview ≠ Reality.",
    render: () => <ProblemSlide />,
  },
  {
    id: "insight",
    section: "main",
    label: "Insight",
    notes:
      "לא לתקוף את CV או הראיון. הם שימושיים ופשוט לא שלמים. הפער הוא Fit together.",
    render: () => <InsightSlide />,
  },
  {
    id: "solution",
    section: "main",
    label: "Mutual Matching",
    notes:
      "להציג שלוש שכבות: Role Fit, Human Fit, Motivation Fit. כל אחת מוסיפה הבנה אחרת.",
    render: () => <SolutionSlide />,
  },
  {
    id: "why-match",
    section: "main",
    label: "Why this match",
    notes:
      "לא רק ציון. להראות Why וPotential gaps. המטרה היא אמון והבנה לפני השיחה.",
    render: () => <WhyMatchSlide />,
  },
  {
    id: "product-flow",
    section: "main",
    label: "Product Flow",
    notes:
      "Discover עד Relationship. המוצר הוא תהליך, לא רשימת Features.",
    render: () => <ProductFlowSlide />,
  },
  {
    id: "product",
    section: "main",
    label: "Product",
    notes:
      "מסכים אמיתיים: Strong Matches וWhy this match. כל משפט חייב להתאים למה שרואים.",
    render: () => <ProductSlide />,
  },
  {
    id: "candidate",
    section: "main",
    label: "Candidate",
    notes:
      "הדגש על בהירות, בחירה וכבוד. המועמד מבין למה לפני שהוא נכנס לשיחה.",
    render: () => <CandidateSlide />,
  },
  {
    id: "company",
    section: "main",
    label: "Company",
    notes:
      "לא יותר מועמדים. Better signal, understanding, matching, conversations, decisions.",
    render: () => <CompanySlide />,
  },
  {
    id: "insights",
    section: "main",
    label: "Insights",
    notes:
      "Dashboard SaaS. לסמן Concept אם הוויזואליזציה רעיונית ולא נתון production.",
    render: () => <InsightsSlide />,
  },
  {
    id: "business-model",
    section: "main",
    label: "Business Model",
    notes:
      "ערך חוזר מעבר לרגע הגיוס: Talent, Employees, Relationships, Referrals, Insights.",
    render: () => <BusinessModelSlide />,
  },
  {
    id: "traction",
    section: "main",
    label: "Traction",
    notes:
      "רק מה שקרה באמת. Timeline של Idea עד Next Stage. בלי מספרי vanity.",
    render: () => <TractionSlide />,
  },
  {
    id: "founder",
    section: "main",
    label: "Founder",
    notes:
      "Founder בלבד, לא CEO. Why me, Why this problem, Why now. קצר ואנושי.",
    render: () => <FounderSlide />,
  },
  {
    id: "vision",
    section: "main",
    label: "Vision",
    notes:
      "החזון הרחב: Relationship layer לפני, במהלך ואחרי הגיוס.",
    render: () => <VisionSlide />,
  },
  {
    id: "closing",
    section: "main",
    label: "סיום",
    notes:
      "להשאיר משפט אחד: Beyond the match. The future of hiring starts before the hire.",
    render: () => <ClosingSlide />,
  },
  {
    id: "appendix-opportunity",
    section: "appendix",
    label: "Opportunity",
    notes:
      "שכבות בלי מספרים מומצאים: Recruitment, Talent Relationship, Employee Relationship, Future of Work.",
    render: () => <OpportunitySlide />,
  },
  {
    id: "appendix-business",
    section: "appendix",
    label: "BM מפורט",
    notes: "לפתוח רק אם שואלים על מודל עסקי או monetization layers.",
    render: () => <AppendixBusinessModelSlide />,
  },
  {
    id: "appendix-matching",
    section: "appendix",
    label: "Matching",
    notes: "פירוט Role / Human / Motivation אם מבקשים עומק אלגוריתמי.",
    render: () => <AppendixMatchingSlide />,
  },
  {
    id: "appendix-journeys",
    section: "appendix",
    label: "Journeys",
    notes: "מסעות Candidate, Recruiter וCompany.",
    render: () => <AppendixJourneysSlide />,
  },
  {
    id: "appendix-product",
    section: "appendix",
    label: "Product+",
    notes: "Employee Portal, Referrals, Advanced Analytics.",
    render: () => <AppendixProductExtrasSlide />,
  },
  {
    id: "appendix-gtm",
    section: "appendix",
    label: "GTM",
    notes: "Go To Market: beachhead, expansion, moat.",
    render: () => <AppendixGtmSlide />,
  },
  {
    id: "appendix-roadmap",
    section: "appendix",
    label: "Roadmap",
    notes: "Now / Next / Later בלי להסיט את הסיפור המרכזי.",
    render: () => <AppendixRoadmapSlide />,
  },
  {
    id: "appendix-landscape",
    section: "appendix",
    label: "Landscape",
    notes: "PeopleForce וכלים דומים מנהלים תהליך. mingle מוסיפה הבנת Fit לפני החיבור.",
    render: () => <AppendixCompetitiveSlide />,
  },
  {
    id: "appendix-founder",
    section: "appendix",
    label: "Founder+",
    notes: "רקע מורחב למייסדת.",
    render: () => <AppendixFounderSlide />,
  },
  {
    id: "appendix-qa",
    section: "appendix",
    label: "Q&A",
    notes: "שאלות נפוצות לסיום או אחרי הפגישה.",
    render: () => <AppendixQaSlide />,
  },
];

export const MAIN_SLIDE_COUNT = DECK_SLIDES.filter((s) => s.section === "main").length;
