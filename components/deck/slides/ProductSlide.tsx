"use client";

import { MatchScoreRing } from "@/components/matching/MatchScoreRing";
import { SlideShell } from "@/components/deck/SlideShell";

const AXES = [
  {
    id: "role",
    label: "Role Fit",
    score: 92,
    finding: "כישורים וניסיון מיושרים לדרישות התפקיד.",
    bar: "#7B2FF7",
    track: "#F1E8FE",
    iconBg: "#7B2FF7",
  },
  {
    id: "human",
    label: "Human Fit",
    score: 87,
    finding: "סגנון עבודה ותרבות מצביעים על עבודה משותפת טובה.",
    bar: "#3E6BE0",
    track: "#E9EFFE",
    iconBg: "#3E6BE0",
  },
  {
    id: "motivation",
    label: "Motivation Fit",
    score: 94,
    finding: "מטרות וערכים מצביעים על כיוון משותף.",
    bar: "#EA1E63",
    track: "#FDEAF1",
    iconBg: "#EA1E63",
  },
];

export function ProductSlide() {
  return (
    <SlideShell
      kicker="Product"
      title="מסכים אמיתיים מהמוצר"
      subtitle="Strong Matches עם הסבר. לא עוד ערמת קורות חיים."
      compact
    >
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-2">
        <div className="deck-browser">
          <div className="deck-browser-bar">
            <span className="deck-browser-dot" />
            <span className="deck-browser-dot" />
            <span className="deck-browser-dot" />
            <span className="deck-browser-url">mingle · Role Matches</span>
          </div>
          <div className="deck-browser-body space-y-3">
            {[
              { name: "Noa Levi", role: "Product Designer", score: 97 },
              { name: "Jordan Hayes", role: "Product Designer", score: 95 },
              { name: "Yael Naveh", role: "Product Designer", score: 94 },
            ].map((row) => (
              <div
                key={row.name}
                className="flex items-center gap-3 rounded-[16px] border border-[color:var(--deck-border)] bg-white p-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: "var(--deck-gradient)" }}
                >
                  {row.name
                    .split(" ")
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold">{row.name}</p>
                  <p className="truncate text-xs text-[color:var(--deck-secondary)]">
                    {row.role}
                  </p>
                </div>
                <MatchScoreRing score={row.score} size={48} showLabel />
              </div>
            ))}
            <p className="pt-1 text-xs font-medium text-[color:var(--deck-secondary)]">
              רשימה קצרה עם ציון והקשר. לא 247 מועמדים בלי הבנה.
            </p>
          </div>
        </div>

        <div className="deck-browser">
          <div className="deck-browser-bar">
            <span className="deck-browser-dot" />
            <span className="deck-browser-dot" />
            <span className="deck-browser-dot" />
            <span className="deck-browser-url">mingle · Why this match</span>
          </div>
          <div className="deck-browser-body bg-white">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-base font-bold">Why this match</p>
                <p className="text-xs text-[color:var(--deck-secondary)]">
                  Role Fit · Human Fit · Motivation Fit
                </p>
              </div>
              <MatchScoreRing score={92} size={56} showLabel />
            </div>
            <div className="flex flex-col">
              {AXES.map((axis, index) => (
                <div
                  key={axis.id}
                  className={`flex items-start gap-3 py-3.5 ${
                    index > 0 ? "border-t border-[color:var(--deck-border)]" : ""
                  }`}
                >
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: axis.iconBg }}
                  >
                    {axis.score}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-[color:var(--deck-dark)]">
                      {axis.label}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <div
                        className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full"
                        style={{ background: axis.track }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${axis.score}%`,
                            background: axis.bar,
                          }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums">
                        {axis.score}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-[color:var(--deck-secondary)]">
                      {axis.finding}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SlideShell>
  );
}
