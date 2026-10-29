"use client";

import { SlideShell } from "@/components/deck/SlideShell";

const NODES = [
  { title: "People", x: "8%", y: "18%" },
  { title: "Companies", x: "72%", y: "14%" },
  { title: "Talent", x: "18%", y: "58%" },
  { title: "Employees", x: "68%", y: "62%" },
  { title: "Managers", x: "42%", y: "78%" },
  { title: "Data", x: "78%", y: "40%" },
  { title: "Insights", x: "6%", y: "40%" },
];

export function VisionSlide() {
  return (
    <SlideShell
      kicker="Vision"
      title="Relationship layer בין אנשים לחברות"
      subtitle="לא רק Recruitment. מערכת יחסים מתמשכת לפני, במהלך ואחרי תהליך הגיוס."
    >
      <div className="relative h-[340px] w-full max-w-4xl overflow-hidden rounded-[24px] border border-[color:var(--deck-border)] bg-[color:var(--deck-soft-gradient)]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 340"
          aria-hidden
        >
          <defs>
            <linearGradient id="deckVisionLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#EA1E63" stopOpacity="0.55" />
              <stop offset="50%" stopColor="#7B2FF7" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#3E6BE0" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path
            d="M120 80 C220 40, 320 140, 400 120 S580 40, 680 70"
            fill="none"
            stroke="url(#deckVisionLine)"
            strokeWidth="2"
          />
          <path
            d="M90 160 C200 200, 280 120, 400 170 S560 240, 720 160"
            fill="none"
            stroke="url(#deckVisionLine)"
            strokeWidth="2"
          />
          <path
            d="M160 220 C260 260, 340 220, 400 250 S540 280, 620 230"
            fill="none"
            stroke="url(#deckVisionLine)"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center text-white shadow-[0_12px_30px_rgba(123,47,247,0.28)]"
          style={{ background: "var(--deck-gradient)" }}
        >
          <p className="font-display text-sm font-bold">Relationships</p>
          <p className="mt-1 text-[10px] font-medium opacity-90">ecosystem</p>
        </div>

        {NODES.map((node) => (
          <div
            key={node.title}
            className="absolute rounded-[14px] border border-[color:var(--deck-border)] bg-white px-3 py-2 text-xs font-bold shadow-[0_4px_16px_rgba(28,27,46,0.06)]"
            style={{ left: node.x, top: node.y }}
          >
            {node.title}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
