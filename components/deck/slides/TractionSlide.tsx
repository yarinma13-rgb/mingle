"use client";

import { SlideShell } from "@/components/deck/SlideShell";

const MILESTONES = [
  {
    title: "Idea",
    body: "הבנה שהבעיה היא Fit, לא רק sourcing.",
  },
  {
    title: "Product",
    body: "מוצר חי עם Mutual Matching, Why this match וDiscovery.",
  },
  {
    title: "Early Users",
    body: "פיילוט עם מועמדים וחברות על מסלול אמיתי.",
  },
  {
    title: "Company Interest",
    body: "עניין מחברות ושיחות על שימוש בגיוס אמיתי.",
  },
  {
    title: "Learning",
    body: "למידה מ funnel, mutual matches והתקדמות לשיחה.",
  },
  {
    title: "Next Stage",
    body: "הרחבת supply של חברות והעמקת Product Market Fit.",
  },
];

export function TractionSlide() {
  return (
    <SlideShell
      kicker="Traction"
      title="התקדמות מוחשית"
      subtitle="רק מה שקרה באמת: מוצר עובד, משתמשים מוקדמים, ולמידה מהשטח."
    >
      <div className="relative w-full max-w-5xl">
        <div
          aria-hidden
          className="absolute inset-x-8 top-[28px] hidden h-0.5 md:block"
          style={{ background: "var(--deck-gradient)" }}
        />
        <div className="grid gap-4 md:grid-cols-6">
          {MILESTONES.map((item, index) => (
            <article key={item.title} className="relative flex flex-col items-center text-center">
              <div
                className="relative z-10 mb-3 flex h-14 w-14 items-center justify-center rounded-full font-display text-sm font-bold text-white"
                style={{ background: "var(--deck-gradient)" }}
              >
                0{index + 1}
              </div>
              <h3 className="font-display text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--deck-secondary)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {[
            { label: "Status", value: "Product live" },
            { label: "Focus", value: "Pilot learning" },
            { label: "Signal", value: "Mutual matches" },
          ].map((card) => (
            <div key={card.label} className="deck-soft-panel px-5 py-4 text-center">
              <p className="text-xs font-semibold text-[color:var(--deck-secondary)]">
                {card.label}
              </p>
              <p className="mt-1 font-display text-lg font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
