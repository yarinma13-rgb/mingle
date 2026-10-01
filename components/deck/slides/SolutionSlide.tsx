"use client";

import { SlideShell } from "@/components/deck/SlideShell";

const LAYERS = [
  {
    title: "Role Fit",
    he: "יכולים?",
    body: "כישורים, ניסיון, דרישות התפקיד והאותות השקטים שבמשרה.",
    color: "#7B2FF7",
    bg: "var(--deck-light-purple)",
  },
  {
    title: "Human Fit",
    he: "ישגשגו?",
    body: "סגנון עבודה, תרבות, סביבה ואופן העבודה המשותף.",
    color: "#3E6BE0",
    bg: "var(--deck-light-blue)",
  },
  {
    title: "Motivation Fit",
    he: "רוצים?",
    body: "מטרות, ערכים, כיוון קריירה ומה באמת מניע את האדם.",
    color: "#EA1E63",
    bg: "var(--deck-light-pink)",
  },
];

export function SolutionSlide() {
  return (
    <SlideShell
      kicker="הפתרון"
      title="Mutual Matching בשלוש שכבות"
      subtitle="לא עוד אלגוריתם התאמה שחור. שלוש שכבות שמסבירות למה החיבור הגיוני, ומה עדיין צריך לבדוק."
    >
      <div className="flex w-full max-w-5xl flex-col items-center gap-6">
        <div className="deck-pill">Mutual Matching</div>
        <div className="grid w-full gap-4 md:grid-cols-3">
          {LAYERS.map((layer, index) => (
            <article
              key={layer.title}
              className="deck-card relative overflow-hidden p-6"
              style={{ background: layer.bg }}
            >
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ background: layer.color }}
              />
              <p className="text-xs font-bold" style={{ color: layer.color }}>
                0{index + 1}
              </p>
              <h3 className="mt-3 font-display text-xl font-bold">{layer.title}</h3>
              <p className="mt-1 text-sm font-semibold text-[color:var(--deck-dark)]">
                {layer.he}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
                {layer.body}
              </p>
            </article>
          ))}
        </div>
        <p className="text-center text-sm font-medium text-[color:var(--deck-secondary)]">
          כל שכבה מוסיפה הבנה אחרת. יחד הן בונות תמונת Fit שלמה יותר.
        </p>
      </div>
    </SlideShell>
  );
}
