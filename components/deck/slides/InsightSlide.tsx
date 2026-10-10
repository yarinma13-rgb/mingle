"use client";

import { SlideShell } from "@/components/deck/SlideShell";

export function InsightSlide() {
  return (
    <SlideShell
      kicker="Insight"
      title="הם שימושיים. הם פשוט לא שלמים."
      subtitle="CV וראיון מספרים מה אדם עשה ומה הוא יודע להציג. הם לא בהכרח מספרים איך האדם והחברה יעבדו יחד בפועל."
    >
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        <article className="deck-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-blue)]">
            Useful
          </p>
          <h3 className="mt-3 font-display text-lg font-bold">CV</h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
            היסטוריה, כישורים, הישגים. אותות חשובים על מה שנעשה.
          </p>
        </article>

        <article className="deck-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-purple)]">
            Useful
          </p>
          <h3 className="mt-3 font-display text-lg font-bold">Interview</h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
            נוכחות, חשיבה, תקשורת. אותות חשובים על איך מספרים את הסיפור.
          </p>
        </article>

        <article
          className="deck-card p-5"
          style={{
            background: "var(--deck-soft-gradient)",
            borderColor: "transparent",
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-pink)]">
            Missing layer
          </p>
          <h3 className="mt-3 font-display text-lg font-bold">Fit together</h3>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
            איך האדם, התפקיד והחברה באמת יעבדו יחד. שכבת ההבנה שחסרה לפני החיבור.
          </p>
        </article>
      </div>

      <div className="mt-8 deck-pill">They are useful. They are just incomplete.</div>
    </SlideShell>
  );
}
