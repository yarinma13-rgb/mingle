"use client";

import { FlowArrow, FlowNode, SlideShell } from "@/components/deck/SlideShell";

export function BusinessModelSlide() {
  return (
    <SlideShell
      kicker="Business Model"
      title="ערך מתמשך, לא רק רגע הגיוס"
      subtitle="המטרה אינה להיתלות רק בפתיחת משרה. mingle יכולה ללוות חברות גם בין גיוסים."
    >
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <FlowNode title="Company" caption="חברה" tone="white" />
          <FlowArrow />
          <FlowNode title="Hiring" caption="גיוס" tone="pink" />
          <FlowArrow />
          <FlowNode title="Talent" caption="טאלנט" tone="purple" />
          <FlowArrow />
          <FlowNode title="Employees" caption="עובדים" tone="blue" />
          <FlowArrow />
          <FlowNode title="Relationships" caption="קשרים" tone="purple" />
          <FlowArrow />
          <FlowNode title="Referrals" caption="המלצות" tone="pink" />
          <FlowArrow />
          <FlowNode title="Insights" caption="תובנות" tone="blue" />
          <FlowArrow />
          <FlowNode title="Recurring value" caption="ערך חוזר" tone="gradient" />
        </div>

        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Hiring moments",
              body: "שימוש חזק כשיש משרה פתוחה וצריך shortlist מוסבר.",
            },
            {
              title: "Always on talent",
              body: "שמירה על קשר עם טאלנט רלוונטי גם כשאין משרה עכשיו.",
            },
            {
              title: "Employee layer",
              body: "Employee Portal, Referrals וInsights כשכבות ערך חוזר.",
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
