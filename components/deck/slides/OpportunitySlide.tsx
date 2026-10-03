"use client";

import { SlideShell } from "@/components/deck/SlideShell";

const LAYERS = [
  {
    title: "Recruitment",
    body: "השכבה הראשונה: מציאת האנשים הנכונים עם הבנה לפני ההחלטה.",
    width: "58%",
  },
  {
    title: "Talent Relationship",
    body: "קשר מתמשך עם טאלנט, גם מחוץ לרגע הפתיחה של משרה.",
    width: "72%",
  },
  {
    title: "Employee Relationship",
    body: "עובדים כחלק מהמערכת: Referrals, Insights וקשר פנים ארגוני.",
    width: "84%",
  },
  {
    title: "Future of Work",
    body: "Relationship layer רחבה בין אנשים לחברות לאורך מחזור החיים.",
    width: "100%",
  },
];

export function OpportunitySlide() {
  return (
    <SlideShell
      kicker="Opportunity"
      title="ההזדמנות גדולה מהגיוס"
      subtitle="השוק מתחיל בRecruitment, אבל הערך האמיתי נמצא בשכבות הקשר שמסביב."
    >
      <div className="flex w-full max-w-3xl flex-col items-stretch gap-3">
        {LAYERS.map((layer, index) => (
          <div
            key={layer.title}
            className="deck-card mx-auto p-5"
            style={{
              width: layer.width,
              background:
                index === 0
                  ? "var(--deck-light-pink)"
                  : index === 1
                    ? "var(--deck-light-purple)"
                    : index === 2
                      ? "var(--deck-light-blue)"
                      : "var(--deck-soft-gradient)",
            }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{layer.title}</h3>
              <span className="text-xs font-bold text-[color:var(--deck-purple)]">
                0{index + 1}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
              {layer.body}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
