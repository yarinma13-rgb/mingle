"use client";

import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { SlideShell } from "@/components/deck/SlideShell";

const WHY = [
  { label: "Skills", finding: "התאמה חזקה לדרישות הליבה של התפקיד" },
  { label: "Experience", finding: "מסלול רלוונטי בשלב חברה דומה" },
  { label: "Work style", finding: "סגנון עבודה שמתחבר לאופן העבודה בצוות" },
  { label: "Goals", finding: "כיוון קריירה שמיושר עם התפקיד" },
  { label: "Values", finding: "ערכים משותפים סביב בעלות ואיכות עשייה" },
  { label: "Motivation", finding: "מה שמניע את האדם קיים בתפקיד" },
];

const GAPS = [
  { label: "Salary expectations", finding: "פער קל מול תקציב המשרה. שווה לדייק בשיחה." },
  { label: "Location", finding: "העדפת עבודה מרחוק מול מודל היברידי." },
];

export function WhyMatchSlide() {
  return (
    <SlideShell
      kicker="Why this match"
      title="לא רק שיש Match. להבין למה."
      subtitle="הציון הוא נקודת כניסה. ההסבר הוא מה שבונה אמון ומאפשר שיחה טובה יותר."
      compact
    >
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="deck-card flex flex-col items-center gap-4 p-6 text-center">
          <MatchScoreRing score={94} size={110} showLabel />
          <div>
            <p className="font-display text-xl font-bold">94% Match</p>
            <p className="mt-1 text-sm text-[color:var(--deck-secondary)]">
              Role · Human · Motivation
            </p>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 text-center">
            {[
              { t: "Role", v: "97" },
              { t: "Human", v: "92" },
              { t: "Motivation", v: "94" },
            ].map((item) => (
              <div
                key={item.t}
                className="rounded-[12px] bg-[color:var(--deck-bg)] px-2 py-3"
              >
                <p className="font-display text-lg font-bold">{item.v}</p>
                <p className="text-[11px] font-semibold text-[color:var(--deck-secondary)]">
                  {item.t}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="deck-card p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-purple)]">
              Why
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {WHY.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[12px] bg-[color:var(--deck-light-purple)] px-3 py-2.5"
                >
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--deck-secondary)]">
                    {item.finding}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="deck-card p-5"
            style={{ background: "var(--deck-gap-bg, #faf6f2)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#c47a5a]">
              Potential gaps
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {GAPS.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[12px] bg-white/85 px-3 py-2.5"
                >
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-[color:var(--deck-secondary)]">
                    {item.finding}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
