"use client";

import { SlideShell } from "@/components/deck/SlideShell";

export function InsightsSlide() {
  return (
    <SlideShell
      kicker="Insights"
      title="שכבת Insights לגיוס"
      subtitle="Dashboard שמרגיש כמו מוצר SaaS: דפוסים, מקורות, Match patterns ונקודות נטישה."
      compact
    >
      <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="deck-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Recruitment funnel</h3>
            <span className="deck-pill">Concept</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Discover", value: 100, color: "#EA1E63" },
              { label: "Match", value: 42, color: "#7B2FF7" },
              { label: "Connect", value: 18, color: "#3E6BE0" },
              { label: "Interview", value: 8, color: "#65647E" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--deck-bg)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.value}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-medium text-[color:var(--deck-secondary)]">
            ויזואליזציה רעיונית של שכבת Insights. לא נתוני production ספציפיים.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            { label: "Match patterns", value: "Role vs Human", tone: "purple" },
            { label: "Drop off points", value: "After shortlist", tone: "pink" },
            { label: "Sources", value: "Referrals rising", tone: "blue" },
            { label: "Trends", value: "Motivation Fit", tone: "purple" },
          ].map((card) => (
            <article
              key={card.label}
              className="deck-card flex items-center justify-between gap-3 p-4"
              style={{
                background:
                  card.tone === "pink"
                    ? "var(--deck-light-pink)"
                    : card.tone === "blue"
                      ? "var(--deck-light-blue)"
                      : "var(--deck-light-purple)",
              }}
            >
              <div>
                <p className="text-xs font-semibold text-[color:var(--deck-secondary)]">
                  {card.label}
                </p>
                <p className="mt-1 font-display text-base font-bold">{card.value}</p>
              </div>
              <div
                className="h-10 w-10 rounded-full"
                style={{ background: "var(--deck-gradient)", opacity: 0.85 }}
              />
            </article>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
