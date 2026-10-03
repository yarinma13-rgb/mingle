"use client";

import { FounderPhoto } from "@/components/deck/FounderPhoto";
import { SlideShell } from "@/components/deck/SlideShell";

const THREADS = [
  { title: "HR", body: "הבנה עמוקה של תהליכי אנשים וארגון." },
  { title: "Recruitment", body: "ניסיון מעשי בכאב של גיוס והחלטות Fit." },
  { title: "People", body: "ראייה של אדם מעבר לCV ולרושם ראשוני." },
  {
    title: "Organizational Development",
    body: "איך אנשים והחברה באמת עובדים יחד לאורך זמן.",
  },
  { title: "Tech", body: "בניית מוצר SaaS חי, לא רק רעיון על גיוס." },
];

export function FounderSlide() {
  return (
    <SlideShell
      kicker="Founder"
      title="Why me? Why this problem? Why now?"
      subtitle="מייסדת יחידה עם חיבור אישי לבעיה, ורקע שמחבר People וTech."
      compact
    >
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="deck-soft-panel flex flex-col items-center gap-4 p-8 text-center">
          <FounderPhoto size={140} />
          <div>
            <p className="font-display text-2xl font-bold">ירין כהן</p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--deck-purple)]">
              Founder
            </p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[color:var(--deck-secondary)]">
            ראיתי מקרוב איך גיוס יכול להיראות נכון על הנייר, ואז להישבר במציאות.
            mingle נולדה מהצורך להבין Fit לפני ההחלטה.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {THREADS.map((item) => (
            <article key={item.title} className="deck-card p-4">
              <h3 className="font-display text-sm font-bold">{item.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--deck-secondary)]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
