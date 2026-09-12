"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MingleLogo } from "@/components/MingleLogo";
import { useLandingLocale } from "@/components/landing/LandingLocale";
import type { AudienceId } from "@/lib/landing/copy";

type Props = {
  audienceId: AudienceId;
};

type Person = {
  name: string;
  role: string;
  match: number;
  avatar: string;
  tags?: string[];
};

const PEOPLE: Person[] = [
  {
    name: "Maya Okonkwo",
    role: "Senior Product Manager",
    match: 97,
    avatar: "/landing/avatars/avatar-maya.png",
    tags: ["B2B SaaS", "Tel Aviv"],
  },
  {
    name: "Arjun Mehta",
    role: "Full-stack Engineer",
    match: 95,
    avatar: "/landing/avatars/avatar-arjun.png",
    tags: ["TypeScript", "Remote"],
  },
  {
    name: "Lin Wei",
    role: "Product Designer",
    match: 94,
    avatar: "/landing/avatars/avatar-lin.png",
    tags: ["Design systems"],
  },
  {
    name: "Noah Berger",
    role: "Backend Engineer",
    match: 92,
    avatar: "/landing/avatars/avatar-noah.png",
    tags: ["Platform"],
  },
  {
    name: "Sofia Alvarez",
    role: "People Partner",
    match: 91,
    avatar: "/landing/avatars/avatar-sofia.png",
    tags: ["Hiring ops"],
  },
];

const CONFETTI_COLORS = [
  "#5B8DEF",
  "#EA1E63",
  "#7B2FF7",
  "#3E6BE0",
  "#F5C542",
  "#22C55E",
  "#C84BDB",
];

function subscribeReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
}

function Avatar({
  person,
  size = 36,
}: {
  person: Person;
  size?: number;
}) {
  return (
    <Image
      src={person.avatar}
      alt=""
      width={size}
      height={size}
      className="landing-stage-avatar"
    />
  );
}

function CompaniesStage({ he }: { he: boolean }) {
  const columns = [
    {
      title: he ? "התאמות חזקות" : "Strong Matches",
      accent: "#7b2ff7",
      cards: PEOPLE.slice(0, 3),
    },
    {
      title: he ? "מעוניינים" : "Interested",
      accent: "#3e6be0",
      cards: PEOPLE.slice(3, 5),
    },
    {
      title: he ? "הדדי" : "Mutual",
      accent: "#ea1e63",
      cards: [PEOPLE[0]],
    },
  ];

  return (
    <div className="landing-stage landing-stage-companies">
      <div className="landing-stage-chrome">
        <span />
        <span />
        <span />
        <p>{he ? "לוח גיוס · Product Designer" : "Hiring board · Product Designer"}</p>
      </div>
      <div className="landing-stage-columns">
        {columns.map((column) => (
          <div key={column.title} className="landing-stage-col">
            <div
              className="landing-stage-col-head"
              style={{ background: column.accent }}
            >
              {column.title}
              <b>{column.cards.length}</b>
            </div>
            <div className="landing-stage-col-body">
              {column.cards.map((card) => (
                <article key={card.name} className="landing-stage-card">
                  <div className="landing-stage-card-top">
                    <Avatar person={card} size={32} />
                    <div>
                      <p className="landing-stage-card-name">{card.name}</p>
                      <p className="landing-stage-card-role">{card.role}</p>
                    </div>
                    <span className="landing-stage-match">{card.match}%</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
      <aside className="landing-stage-float landing-stage-float-why">
        <strong>{he ? "למה ההתאמה" : "Why this match"}</strong>
        <ul>
          <li className="is-good">
            {he ? "5/5 כישורים ליבה" : "5/5 core skills"}
          </li>
          <li className="is-good">
            {he ? "שלב חברה דומה" : "Similar company stage"}
          </li>
          <li className="is-warn">
            {he ? "מעדיף remote · התפקיד 3 ימים במשרד" : "Prefers remote · role asks 3 office days"}
          </li>
        </ul>
      </aside>
    </div>
  );
}

function RecruitersStage({ he }: { he: boolean }) {
  const [revealed, setRevealed] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const timers = PEOPLE.map((_, index) =>
      window.setTimeout(() => setRevealed(index + 1), 450 + index * 520),
    );
    const selectTimer = window.setTimeout(
      () => setSelected(PEOPLE[0].name),
      450 + PEOPLE.length * 520 + 350,
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(selectTimer);
    };
  }, [reduceMotion]);

  const visibleCount = reduceMotion ? PEOPLE.length : Math.max(1, revealed);
  const visible = PEOPLE.slice(0, visibleCount);

  return (
    <div className="landing-stage landing-stage-recruiters">
      <header className="landing-stage-panel-head">
        <div>
          <p className="landing-stage-kicker">
            {he ? "תוך שניות" : "In seconds"}
          </p>
          <h3>{he ? "ההתאמות הכי גבוהות" : "Highest matches first"}</h3>
        </div>
        <span className="landing-stage-live">
          {he ? "מדרג עכשיו" : "Ranking now"}
        </span>
      </header>
      <ol className="landing-stage-shortlist">
        {visible.map((person, index) => {
          const active = selected === person.name;
          return (
            <li
              key={person.name}
              className={`landing-stage-shortlist-row ${active ? "is-selected" : ""} ${index === visible.length - 1 ? "is-entering" : ""}`}
            >
              <span className="landing-stage-rank">{index + 1}</span>
              <Avatar person={person} />
              <div className="landing-stage-shortlist-meta">
                <p>{person.name}</p>
                <span>{person.role}</span>
              </div>
              <div className="landing-stage-bars" aria-hidden>
                <i style={{ width: `${person.match - 2}%` }} className="is-role" />
                <i style={{ width: `${person.match - 5}%` }} className="is-human" />
                <i style={{ width: `${person.match - 3}%` }} className="is-motivation" />
              </div>
              <strong>{person.match}%</strong>
              <button
                type="button"
                className={active ? "is-on" : undefined}
                onClick={() => setSelected(person.name)}
              >
                {active
                  ? he
                    ? "נבחר"
                    : "Shortlisted"
                  : he
                    ? "לבחור"
                    : "Shortlist"}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="landing-stage-footnote">
        {he
          ? "רק השאלות שחסרות · בלי שאלון ארוך"
          : "Only missing questions · no long questionnaire"}
      </p>
    </div>
  );
}

function FoundersStage({ he }: { he: boolean }) {
  const meters = [
    {
      label: he ? "זמן שנחסך" : "Time saved",
      value: "18h",
      sub: he ? "לשבוע גיוס" : "/ hiring week",
      color: "#7b2ff7",
      pct: 78,
    },
    {
      label: he ? "כסף שנשמר" : "Money protected",
      value: "$12k",
      sub: he ? "ממוצע למשרה" : "avg per role",
      color: "#3e6be0",
      pct: 72,
    },
    {
      label: he ? "מאמץ שנחסך" : "Effort cut",
      value: "64%",
      sub: he ? "פחות סינון ידני" : "less manual screening",
      color: "#ea1e63",
      pct: 64,
    },
  ];

  return (
    <div className="landing-stage landing-stage-founders">
      <header className="landing-stage-panel-head">
        <div>
          <p className="landing-stage-kicker">
            {he ? "למייסדים שמגייסים לבד" : "For founders hiring lean"}
          </p>
          <h3>{he ? "צוות גיוס בכיס" : "A recruiting team in your pocket"}</h3>
        </div>
      </header>
      <div className="landing-stage-meters">
        {meters.map((meter) => (
          <article key={meter.label} className="landing-stage-meter">
            <div
              className="landing-stage-meter-ring"
              style={{
                background: `conic-gradient(${meter.color} ${meter.pct * 3.6}deg, #ececf3 0deg)`,
              }}
            >
              <div className="landing-stage-meter-hole">
                <strong>{meter.value}</strong>
              </div>
            </div>
            <p>{meter.label}</p>
            <span>{meter.sub}</span>
          </article>
        ))}
      </div>
      <div className="landing-stage-founder-split">
        <div className="landing-stage-top-match">
          <Avatar person={PEOPLE[2]} size={44} />
          <div>
            <p>{PEOPLE[2].name}</p>
            <span>{PEOPLE[2].role}</span>
          </div>
          <b>96%</b>
        </div>
        <aside className="landing-stage-risks">
          <strong>{he ? "סיכונים לפני שיחה" : "Risks before the call"}</strong>
          <ul>
            <li>{he ? "ציפיית שכר גבוהה ב־8%" : "Salary band 8% above budget"}</li>
            <li>{he ? "מעדיף remote · אתם hybrid" : "Prefers remote · you are hybrid"}</li>
          </ul>
        </aside>
      </div>
      <p className="landing-stage-footnote">
        {he
          ? "Role · Human · Motivation — לפני ששורפים קלנדר"
          : "Role · Human · Motivation — before you burn calendar"}
      </p>
    </div>
  );
}

function TalentsStage({ he }: { he: boolean }) {
  const reduceMotion = usePrefersReducedMotion();
  const confetti = useMemo(() => {
    if (reduceMotion) return [];
    return Array.from({ length: 42 }, (_, i) => {
      const angle = (i / 42) * Math.PI * 2;
      const dist = 40 + (i % 7) * 14;
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist * 0.75,
        delay: (i % 10) * 0.04,
        size: 5 + (i % 5),
      };
    });
  }, [reduceMotion]);

  const person = PEOPLE[0];

  return (
    <div className="landing-stage landing-stage-talents">
      <div className="landing-stage-talent-burst" aria-hidden>
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className="landing-stage-talent-confetti"
            style={{
              background: piece.color,
              width: piece.size,
              height: piece.size * 1.8,
              animationDelay: `${piece.delay}s`,
              ["--tx" as string]: `${piece.x}px`,
              ["--ty" as string]: `${piece.y}px`,
            }}
          />
        ))}
      </div>

      <article className="landing-stage-profile">
        <header>
          <Avatar person={person} size={56} />
          <div>
            <p className="landing-stage-kicker">
              {he ? "פרופיל מועמד" : "Talent profile"}
            </p>
            <h3>{person.name}</h3>
            <span>{person.role}</span>
          </div>
          <span className="landing-stage-free-pill">
            {he ? "חינם" : "Free"}
          </span>
        </header>
        <ul className="landing-stage-dna">
          <li>
            <b>{he ? "DNA מועמד" : "Candidate DNA"}</b>
            <span>{he ? "נבנה מהפרופיל שלך" : "Built from what you share"}</span>
          </li>
          <li>
            <b>{he ? "עניין הדדי בלבד" : "Mutual interest only"}</b>
            <span>{he ? "מדברים כששני הצדדים רוצים" : "Talk when both sides want to"}</span>
          </li>
          <li>
            <b>{he ? "למה ההתאמה" : "Why this match"}</b>
            <span>{he ? "שקוף לשני הצדדים" : "Clear for both sides"}</span>
          </li>
        </ul>
      </article>

      <article className="landing-stage-salary">
        <p className="landing-stage-kicker">
          {he ? "בניית פרופיל · שלב שכר" : "Profile setup · salary"}
        </p>
        <h4>{he ? "מגדירים שכר כמו שנוח לכם" : "Set salary your way"}</h4>
        <div className="landing-stage-salary-track" aria-hidden>
          <span className="landing-stage-salary-fill" />
          <span className="landing-stage-salary-knob" />
        </div>
        <div className="landing-stage-salary-meta">
          <span>$140k</span>
          <strong>$165k</strong>
          <span>$190k</span>
        </div>
        <p className="landing-stage-footnote">
          {he
            ? "פרטי · לא חושפים מספר גולמי לחברות לפני עניין הדדי"
            : "Private · companies don’t see raw numbers before mutual interest"}
        </p>
      </article>
    </div>
  );
}

function AgenciesStage({ he }: { he: boolean }) {
  const rows = [
    {
      client: "Nova Labs",
      role: "Staff Engineer",
      status: he ? "מוכן לשליחה" : "Ready to send",
      matches: 4,
      person: PEOPLE[1],
      tone: "ready" as const,
    },
    {
      client: "Bright Health",
      role: "Design Lead",
      status: he ? "התאמות מוסברות" : "Explained matches",
      matches: 6,
      person: PEOPLE[2],
      tone: "active" as const,
    },
    {
      client: "Orbit OS",
      role: "Outsource squad",
      status: he ? "ספסל חזק" : "Bench growing",
      matches: 9,
      person: PEOPLE[3],
      tone: "bench" as const,
    },
  ];

  return (
    <div className="landing-stage landing-stage-agencies">
      <header className="landing-stage-panel-head">
        <div>
          <p className="landing-stage-kicker">
            {he ? "סוכנויות גיוס ו־outsourcing" : "Recruiting & outsourcing agencies"}
          </p>
          <h3>{he ? "יותר אמון. יותר נראות. יותר טאלנט." : "More trust. More visibility. Stronger talent."}</h3>
        </div>
      </header>
      <div className="landing-stage-agency-grid">
        {rows.map((row) => (
          <article
            key={row.client}
            className={`landing-stage-agency-row is-${row.tone}`}
          >
            <Avatar person={row.person} />
            <div>
              <p>{row.client}</p>
              <span>{row.role}</span>
            </div>
            <b>{row.matches}</b>
            <em>{row.status}</em>
          </article>
        ))}
      </div>
      <aside className="landing-stage-agency-pitch">
        <MingleLogo variant="mark" size={28} />
        <p>
          {he
            ? "מפרסמים ב־mingle → הלקוחות רואים התאמות מוסברות, והאנשים הטובים מגיעים אליכם — גם ל־outsourcing."
            : "Post on mingle → clients see explained matches, and stronger people find you — including for outsourcing benches."}
        </p>
      </aside>
    </div>
  );
}

export function LandingAudienceStage({ audienceId }: Props) {
  const { locale } = useLandingLocale();
  const he = locale === "he";

  return (
    <div className="landing-audience-stage" data-audience={audienceId}>
      {audienceId === "companies" ? <CompaniesStage key={`co-${locale}`} he={he} /> : null}
      {audienceId === "recruiters" ? (
        <RecruitersStage key={`re-${locale}`} he={he} />
      ) : null}
      {audienceId === "founders" ? <FoundersStage key={`fo-${locale}`} he={he} /> : null}
      {audienceId === "talents" ? <TalentsStage key={`ta-${locale}`} he={he} /> : null}
      {audienceId === "agencies" ? <AgenciesStage key={`ag-${locale}`} he={he} /> : null}
    </div>
  );
}
