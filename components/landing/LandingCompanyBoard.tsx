"use client";

import { useLandingLocale } from "@/components/landing/LandingLocale";

type BoardCard = {
  name: string;
  role: string;
  match: number;
  confidence: "high" | "medium" | "low";
  note?: string;
  /** Inline risk chip — avoids overlapping float badges */
  risk?: boolean;
};

type BoardColumn = {
  id: string;
  titleKey: "sourcing" | "screening" | "mutual" | "conversation";
  accent: string;
  cards: BoardCard[];
};

const COLUMNS: BoardColumn[] = [
  {
    id: "strong",
    titleKey: "sourcing",
    accent: "#7b2ff7",
    cards: [
      {
        name: "Noa Levi",
        role: "Product Designer",
        match: 94,
        confidence: "high",
        note: "Role 97 · Human 92",
      },
      {
        name: "Eli Cohen",
        role: "Full-stack",
        match: 91,
        confidence: "high",
        note: "Motivation 95",
      },
      {
        name: "Maya Bar",
        role: "PM",
        match: 86,
        confidence: "medium",
        note: "Thin profile",
        risk: true,
      },
    ],
  },
  {
    id: "interested",
    titleKey: "screening",
    accent: "#3e6be0",
    cards: [
      {
        name: "Tom Asher",
        role: "Backend",
        match: 93,
        confidence: "high",
        note: "Why this match open",
      },
      {
        name: "Dana Shalev",
        role: "Data",
        match: 88,
        confidence: "medium",
      },
    ],
  },
  {
    id: "mutual",
    titleKey: "mutual",
    accent: "#ea1e63",
    cards: [
      {
        name: "Yuval Ben",
        role: "Design lead",
        match: 96,
        confidence: "high",
        note: "Mutual interest",
      },
    ],
  },
  {
    id: "talk",
    titleKey: "conversation",
    accent: "#00ca72",
    cards: [
      {
        name: "Ori Katz",
        role: "Engineer",
        match: 92,
        confidence: "high",
        note: "Interview booked",
      },
    ],
  },
];

const COPY = {
  en: {
    eyebrow: "For hiring teams",
    title: "Roles, candidates, reasons.",
    titleAccent: "Clear.",
    lead: "A live hiring board with Strong Matches, interest, and Why this match on every card — not another CV pile.",
    cta: "Get Started",
    boardTitle: "Hiring board · Product Designer",
    columns: {
      sourcing: "Strong Matches",
      screening: "Interested",
      mutual: "Mutual",
      conversation: "In conversation",
    },
    confidence: {
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    floatWhy: "Why this match",
    floatRisk: "1 honest risk",
  },
  he: {
    eyebrow: "לצוותי גיוס",
    title: "תפקידים, מועמדים, סיבות.",
    titleAccent: "ברור.",
    lead: "לוח גיוס חי עם התאמות חזקות, עניין, ולמה ההתאמה על כל כרטיס — לא עוד ערמת קורות חיים.",
    cta: "להתחיל",
    boardTitle: "לוח גיוס · Product Designer",
    columns: {
      sourcing: "התאמות חזקות",
      screening: "מעוניינים",
      mutual: "הדדי",
      conversation: "בשיחה",
    },
    confidence: {
      high: "גבוה",
      medium: "בינוני",
      low: "נמוך",
    },
    floatWhy: "למה ההתאמה",
    floatRisk: "סיכון כנה אחד",
  },
} as const;

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}

export function LandingCompanyBoard() {
  const { locale } = useLandingLocale();
  const copy = COPY[locale];

  return (
    <section
      id="company-board"
      className="landing-section landing-company-board-section"
      aria-labelledby="landing-company-board-title"
    >
      <div className="landing-shell landing-company-board-layout">
        <div className="landing-company-board-copy">
          <p className="landing-moment-eyebrow">{copy.eyebrow}</p>
          <h2 id="landing-company-board-title">
            {copy.title}{" "}
            <span className="landing-accent-word">{copy.titleAccent}</span>
          </h2>
          <p>{copy.lead}</p>
          <a href="/auth?mode=signup&path=company" className="landing-btn landing-btn-primary">
            {copy.cta}
            <span aria-hidden>→</span>
          </a>
        </div>

        <div className="landing-company-board" aria-hidden="true">
          <div className="landing-company-board-chrome">
            <span />
            <span />
            <span />
            <p>{copy.boardTitle}</p>
          </div>

          <div className="landing-company-board-columns">
            {COLUMNS.map((column) => (
              <div key={column.id} className="landing-company-col">
                <div
                  className="landing-company-col-head"
                  style={{ background: column.accent }}
                >
                  {copy.columns[column.titleKey]}
                  <b>{column.cards.length}</b>
                </div>
                <div className="landing-company-col-body">
                  {column.cards.map((card) => (
                    <article key={card.name} className="landing-company-card">
                      <div className="landing-company-card-top">
                        <span
                          className="landing-company-avatar"
                          style={{ background: column.accent }}
                        >
                          {initials(card.name)}
                        </span>
                        <div>
                          <p className="landing-company-card-name">{card.name}</p>
                          <p className="landing-company-card-role">{card.role}</p>
                        </div>
                        <span className="landing-company-match">{card.match}%</span>
                      </div>
                      <div className="landing-company-card-meta">
                        <span
                          className={`landing-company-confidence is-${card.confidence}`}
                        >
                          {copy.confidence[card.confidence]}
                        </span>
                        {card.note ? <span>{card.note}</span> : null}
                      </div>
                      {card.risk ? (
                        <p className="landing-company-card-risk">{copy.floatRisk}</p>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="landing-company-float landing-company-float-why">
            <strong>{copy.floatWhy}</strong>
            <span>Role · Human · Motivation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
