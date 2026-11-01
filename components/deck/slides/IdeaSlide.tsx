"use client";

import { FlowArrow, FlowNode, SlideShell } from "@/components/deck/SlideShell";

export function IdeaSlide() {
  return (
    <SlideShell
      kicker="הרעיון"
      title="mingle היא שכבת הקשר לפני ההעסקה"
      subtitle="לא עוד מנוע חיפוש למועמדים. Relationship layer שמחברת אנשים וחברות כשההבנה עדיין חשובה יותר מההחלטה."
    >
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <FlowNode title="People" caption="אנשים" tone="pink" />
          <FlowArrow />
          <FlowNode title="Relationship" caption="הבנה הדדית" tone="purple" />
          <FlowArrow />
          <FlowNode title="Match" caption="Mutual Matching" tone="blue" />
          <FlowArrow />
          <FlowNode title="Employment" caption="העסקה" tone="gradient" />
        </div>

        <div className="deck-soft-panel max-w-2xl px-8 py-5 text-center">
          <p className="font-display text-lg font-semibold text-[color:var(--deck-dark)]">
            לפני שמחליטים, צריך להבין אם באמת קיים Fit.
          </p>
          <p className="mt-2 text-sm font-medium text-[color:var(--deck-secondary)]">
            בין האדם, התפקיד והחברה.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}
