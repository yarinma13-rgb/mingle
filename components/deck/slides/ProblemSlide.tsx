"use client";

import { SlideShell } from "@/components/deck/SlideShell";

export function ProblemSlide() {
  return (
    <SlideShell
      kicker="הבעיה"
      title="מה שרואים לפני הגיוס ≠ מה שמתגלה אחרי"
      subtitle="CV וראיון מספרים חלק מהסיפור. המציאות בעבודה מספרת סיפור אחר."
    >
      <div className="grid w-full max-w-5xl gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <div className="deck-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-blue)]">
            לפני
          </p>
          <h3 className="mt-2 font-display text-xl font-bold">מה שרואים</h3>
          <div className="mt-5 flex flex-col gap-3">
            {["CV", "Interview", "Keywords", "Impression"].map((item) => (
              <div
                key={item}
                className="rounded-[14px] border border-[color:var(--deck-border)] bg-[color:var(--deck-light-blue)] px-4 py-3 font-display text-sm font-semibold"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 px-2">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl font-bold text-white"
            style={{ background: "var(--deck-gradient)" }}
            aria-hidden
          >
            ≠
          </div>
          <p className="max-w-[8rem] text-center text-xs font-semibold text-[color:var(--deck-secondary)]">
            How did we get from this to this?
          </p>
        </div>

        <div className="deck-card p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-pink)]">
            אחרי
          </p>
          <h3 className="mt-2 font-display text-xl font-bold">מה שמתגלה</h3>
          <div className="mt-5 flex flex-col gap-3">
            {[
              "Work style",
              "Motivation",
              "Values",
              "Day to day Reality",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[14px] border border-[color:var(--deck-border)] bg-[color:var(--deck-light-pink)] px-4 py-3 font-display text-sm font-semibold"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 font-display text-center text-lg font-bold tracking-[-0.02em]">
        <span className="deck-gradient-text">CV + Interview ≠ Reality</span>
      </p>
    </SlideShell>
  );
}
