"use client";

import { SlideShell } from "@/components/deck/SlideShell";

const VALUES = [
  { title: "Better signal", body: "פחות רעש. יותר אנשים שבאמת שווה לדבר איתם." },
  {
    title: "Better understanding",
    body: "הבנה של Fit לפני שמבזבזים סבבי ראיונות.",
  },
  {
    title: "Better matching",
    body: "Role, Human וMotivation יחד, לא רק מילות מפתח.",
  },
  {
    title: "Better conversations",
    body: "שיחה ראשונה שמתחילה מנקודות ברורות לבדיקה.",
  },
  {
    title: "Better decisions",
    body: "החלטות שמבוססות על הבנה, לא רק על רושם ראשוני.",
  },
];

export function CompanySlide() {
  return (
    <SlideShell
      kicker="Recruiter Experience"
      title="לא רק יותר מועמדים"
      subtitle="הערך לחברה הוא איכות הסיגנל, לא נפח. פחות סינון ידני, יותר שיחות נכונות."
    >
      <div className="grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {VALUES.map((item, index) => (
          <article
            key={item.title}
            className="deck-card flex flex-col p-4"
            style={{
              background:
                index % 3 === 0
                  ? "var(--deck-light-pink)"
                  : index % 3 === 1
                    ? "var(--deck-light-purple)"
                    : "var(--deck-light-blue)",
            }}
          >
            <p className="text-xs font-bold text-[color:var(--deck-purple)]">
              0{index + 1}
            </p>
            <h3 className="mt-3 font-display text-[15px] font-bold leading-snug">
              {item.title}
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--deck-secondary)]">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}
