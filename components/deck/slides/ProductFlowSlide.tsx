"use client";

import { FlowArrow, FlowNode, SlideShell } from "@/components/deck/SlideShell";

const STEPS = [
  { title: "Discover", caption: "גילוי" },
  { title: "Understand", caption: "הבנה" },
  { title: "Match", caption: "התאמה" },
  { title: "Connect", caption: "חיבור" },
  { title: "Learn", caption: "למידה" },
  { title: "Relationship", caption: "מערכת יחסים" },
];

export function ProductFlowSlide() {
  return (
    <SlideShell
      kicker="Product Flow"
      title="מהגילוי למערכת יחסים"
      subtitle="המוצר לא נגמר בציון. הוא מלווה את התהליך מהרגע שבו עדיין לא מכירים, עד שיש שפה משותפת."
    >
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.title} className="flex items-center gap-2">
              <FlowNode
                title={step.title}
                caption={step.caption}
                tone={
                  index === 0
                    ? "pink"
                    : index === STEPS.length - 1
                      ? "gradient"
                      : index % 2 === 0
                        ? "purple"
                        : "blue"
                }
              />
              {index < STEPS.length - 1 ? <FlowArrow /> : null}
            </div>
          ))}
        </div>

        <div className="grid w-full max-w-4xl gap-3 md:grid-cols-3">
          {[
            {
              title: "Signal in",
              body: "פרופילים, משרות ואותות אמיתיים נכנסים למערכת.",
            },
            {
              title: "Explained match",
              body: "שני הצדדים רואים למה יש Fit ומה כדאי לבדוק.",
            },
            {
              title: "Learning loop",
              body: "תוצאות שיחה והחלטות מלמדות את המערכת קדימה.",
            },
          ].map((card) => (
            <article key={card.title} className="deck-card p-5">
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
