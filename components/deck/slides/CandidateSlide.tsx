"use client";

import { FlowArrow, FlowNode, SlideShell } from "@/components/deck/SlideShell";

export function CandidateSlide() {
  return (
    <SlideShell
      kicker="Candidate Experience"
      title="לא רק עוד תהליך גיוס"
      subtitle="המועמד מבין טוב יותר מה מתאים לו, ומה החברה באמת מחפשת, לפני שהוא נכנס לשיחה."
    >
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <FlowNode title="Candidate" caption="מועמד" tone="gradient" />
          <FlowArrow />
          <FlowNode title="Discover" caption="גילוי" tone="pink" />
          <FlowArrow />
          <FlowNode title="Understand" caption="הבנה" tone="purple" />
          <FlowArrow />
          <FlowNode title="Match" caption="התאמה" tone="blue" />
          <FlowArrow />
          <FlowNode title="Connect" caption="חיבור" tone="white" />
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Clarity",
              body: "רואים למה תפקיד מתאים, ולא רק שהאלגוריתם החליט.",
            },
            {
              title: "Agency",
              body: "מדברים כשיש עניין הדדי. פחות פניות קרות, יותר כוונה.",
            },
            {
              title: "Respect",
              body: "Potential gaps גלויים לשני הצדדים. שקיפות במקום הפתעות.",
            },
          ].map((card) => (
            <article key={card.title} className="deck-soft-panel p-5">
              <h3 className="font-display text-base font-bold">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
