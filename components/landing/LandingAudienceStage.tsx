"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { MingleLogo } from "@/components/MingleLogo";
import { useLandingLocale } from "@/components/landing/LandingLocale";
import type { AudienceId } from "@/lib/landing/copy";
import {
  readClientSalaryMarket,
  salaryRangeForMarket,
  type SalaryMarket,
} from "@/lib/landing/salary-market";

type Props = {
  audienceId: AudienceId;
};

type Person = {
  name: string;
  role: string;
  location: string;
  match: number;
  avatar: string;
  skills: string[];
  roleFit: number;
  humanFit: number;
  motivationFit: number;
  tier: "high" | "medium";
  /** Always realistic photo portraits for a unified look. */
  style: "photo";
};

/** Mix of Israelis + Americans, ages ~25–39 — all realistic photos. */
const PEOPLE: Person[] = [
  {
    name: "Noa Levi",
    role: "Senior Product Manager",
    location: "Tel Aviv",
    match: 97,
    avatar: "/landing/avatars/avatar-maya.png",
    skills: ["Roadmaps", "B2B SaaS", "Discovery", "Leadership"],
    roleFit: 96,
    humanFit: 94,
    motivationFit: 88,
    tier: "high",
    style: "photo",
  },
  {
    name: "Jordan Hayes",
    role: "Full-stack Engineer",
    location: "Austin",
    match: 95,
    avatar: "/landing/avatars/avatar-noah.png",
    skills: ["TypeScript", "React", "Node", "Systems"],
    roleFit: 94,
    humanFit: 91,
    motivationFit: 86,
    tier: "high",
    style: "photo",
  },
  {
    name: "Yael Mizrahi",
    role: "Product Designer",
    location: "Tel Aviv",
    match: 94,
    avatar: "/landing/avatars/avatar-sofia.png",
    skills: ["Figma", "User Research", "Prototyping", "Leadership"],
    roleFit: 93,
    humanFit: 90,
    motivationFit: 84,
    tier: "high",
    style: "photo",
  },
  {
    name: "Arjun Mehta",
    role: "Backend Engineer",
    location: "New York",
    match: 88,
    avatar: "/landing/avatars/avatar-arjun.png",
    skills: ["Platform", "Go", "Reliability"],
    roleFit: 90,
    humanFit: 84,
    motivationFit: 62,
    tier: "medium",
    style: "photo",
  },
  {
    name: "Lin Chen",
    role: "Growth Marketer",
    location: "Chicago",
    match: 86,
    avatar: "/landing/avatars/avatar-lin.png",
    skills: ["Lifecycle", "Copy", "Experimentation"],
    roleFit: 88,
    humanFit: 86,
    motivationFit: 70,
    tier: "medium",
    style: "photo",
  },
];

const CONFETTI_COLORS = [
  "#FF5CA8",
  "#FFD166",
  "#5B8DEF",
  "#22C55E",
  "#C84BDB",
  "#7B2FF7",
  "#3E6BE0",
  "#EA1E63",
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
    () => false,
  );
}

function subscribeSalaryMarket(onStoreChange: () => void) {
  window.addEventListener("languagechange", onStoreChange);
  return () => window.removeEventListener("languagechange", onStoreChange);
}

function useSalaryMarket(): SalaryMarket {
  return useSyncExternalStore(
    subscribeSalaryMarket,
    readClientSalaryMarket,
    () => "us",
  );
}

function Avatar({
  person,
  size = 48,
  className = "",
}: {
  person: Person;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src={person.avatar}
      alt={person.name}
      width={size}
      height={size}
      className={`landing-stage-avatar ${className}`.trim()}
    />
  );
}

function AnimatedMeterRing({
  pct,
  color,
  value,
  delayMs,
  reduceMotion,
}: {
  pct: number;
  color: string;
  value: string;
  delayMs: number;
  reduceMotion: boolean;
}) {
  const size = 90;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [fill, setFill] = useState(reduceMotion ? pct : 0);

  useEffect(() => {
    if (reduceMotion) {
      setFill(pct);
      return;
    }

    let cancelled = false;
    let timeoutId = 0;

    const run = (phase: "fill" | "hold" | "empty") => {
      if (cancelled) return;
      if (phase === "fill") {
        setFill(pct);
        timeoutId = window.setTimeout(() => run("hold"), 2200);
      } else if (phase === "hold") {
        timeoutId = window.setTimeout(() => run("empty"), 1600);
      } else {
        setFill(0);
        timeoutId = window.setTimeout(() => run("fill"), 1100);
      }
    };

    timeoutId = window.setTimeout(() => run("fill"), delayMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [delayMs, pct, reduceMotion]);

  const offset = circumference * (1 - fill / 100);

  return (
    <div className="landing-stage-meter-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ececf3"
          strokeWidth={stroke}
        />
        <circle
          className="landing-stage-meter-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="landing-stage-meter-hole">
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MatchRing({ value, size = 52 }: { value: number; size?: number }) {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="landing-stage-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e8e6ef"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <strong>{value}%</strong>
    </div>
  );
}

function FitBars({ person, he }: { person: Person; he: boolean }) {
  const bars = [
    { key: "role", label: he ? "תפקיד" : "Role", value: person.roleFit, tone: "role" },
    { key: "human", label: he ? "אדם" : "Human", value: person.humanFit, tone: "human" },
    {
      key: "motivation",
      label: he ? "מוטיבציה" : "Motivation",
      value: person.motivationFit,
      tone: "motivation",
    },
  ];

  return (
    <div className="landing-stage-fitbars" aria-hidden>
      {bars.map((bar) => (
        <div key={bar.key} className="landing-stage-fitbar">
          <span>{bar.label}</span>
          <i className={`is-${bar.tone}`}>
            <b style={{ width: `${bar.value}%` }} />
          </i>
        </div>
      ))}
    </div>
  );
}

function CompaniesStage({ he }: { he: boolean }) {
  const columns = [
    {
      title: he ? "התאמות חזקות" : "Strong Matches",
      accent: "#7b2ff7",
      person: PEOPLE[0],
      badge: "green" as const,
    },
    {
      title: he ? "מעוניינים" : "Interested",
      accent: "#5b8def",
      person: PEOPLE[1],
      badge: "blue" as const,
    },
    {
      title: he ? "הדדי" : "Mutual",
      accent: "#ea1e63",
      person: PEOPLE[2],
      badge: "pink" as const,
    },
  ];

  return (
    <div className="landing-stage landing-stage-companies">
      <div className="landing-stage-board">
        {columns.map((column) => (
          <div key={column.title} className="landing-stage-board-col">
            <div
              className="landing-stage-board-head"
              style={{ background: column.accent }}
            >
              {column.title}
            </div>
            <article className="landing-stage-person-card">
              <div className="landing-stage-person-photo">
                <Image
                  src={column.person.avatar}
                  alt={column.person.name}
                  fill
                  sizes="160px"
                  className="landing-stage-person-img"
                />
              </div>
              <p className="landing-stage-person-name">{column.person.name}</p>
              <span className={`landing-stage-match-pill is-${column.badge}`}>
                {column.person.match}% {he ? "התאמה" : "Match"}
              </span>
            </article>
          </div>
        ))}
      </div>

      <aside className="landing-stage-why-card">
        <strong>{he ? "למה ההתאמה" : "Why this match"}</strong>
        <ul>
          <li className="is-good">
            <span>✓</span>
            {he ? "התאמת כישורים" : "Skills match"}
          </li>
          <li className="is-good">
            <span>✓</span>
            {he ? "ניסיון תואם" : "Experience aligns"}
          </li>
          <li className="is-good">
            <span>✓</span>
            {he ? "התאמת תרבות" : "Culture fit"}
          </li>
          <li className="is-risk">
            <span>!</span>
            {he ? "סיכון: נדרש מעבר דירה" : "Risk: Relocation required"}
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
      window.setTimeout(() => setRevealed(index + 1), 280 + index * 420),
    );
    const selectTimer = window.setTimeout(
      () => setSelected(PEOPLE[2].name),
      280 + PEOPLE.length * 420 + 280,
    );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(selectTimer);
    };
  }, [reduceMotion]);

  const visibleCount = reduceMotion ? PEOPLE.length : Math.max(1, revealed);
  const visible = PEOPLE.slice(0, visibleCount);
  const activeName = reduceMotion ? PEOPLE[2].name : selected;

  return (
    <div className="landing-stage landing-stage-recruiters">
      <header className="landing-stage-panel-head">
        <h3>{he ? "ההתאמות הכי גבוהות" : "Top Matches"}</h3>
        <span className="landing-stage-live">
          {he ? "תוך שניות" : "In seconds"}
        </span>
      </header>

      <ol className="landing-stage-toplist">
        {visible.map((person, index) => {
          const active = activeName === person.name;
          return (
            <li
              key={person.name}
              className={`landing-stage-toplist-row ${active ? "is-selected" : ""} ${index === visible.length - 1 ? "is-entering" : ""}`}
            >
              <button
                type="button"
                className="landing-stage-toplist-hit"
                onClick={() => setSelected(person.name)}
              >
                <span className="landing-stage-rank">{index + 1}</span>
                <MatchRing value={person.match} />
                <Avatar person={person} size={46} className="is-lg" />
                <div className="landing-stage-toplist-meta">
                  <p>{person.name}</p>
                  <span>{person.role}</span>
                  <FitBars person={person} he={he} />
                </div>
                <em className={`landing-stage-tier is-${person.tier}`}>
                  {person.tier === "high"
                    ? he
                      ? "גבוה"
                      : "High"
                    : he
                      ? "בינוני"
                      : "Medium"}
                </em>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FoundersStage({ he }: { he: boolean }) {
  const person = PEOPLE[2];
  const reduceMotion = usePrefersReducedMotion();
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
      color: "#5b8def",
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
        {meters.map((meter, index) => (
          <article key={meter.label} className="landing-stage-meter">
            <AnimatedMeterRing
              pct={meter.pct}
              color={meter.color}
              value={meter.value}
              delayMs={180 + index * 280}
              reduceMotion={reduceMotion}
            />
            <p>{meter.label}</p>
            <span>{meter.sub}</span>
          </article>
        ))}
      </div>

      <div className="landing-stage-founder-split">
        <article className="landing-stage-founder-match">
          <div className="landing-stage-founder-photo">
            <Image
              src={person.avatar}
              alt={person.name}
              fill
              sizes="88px"
              className="landing-stage-person-img"
            />
          </div>
          <div>
            <p>{person.name}</p>
            <span>{person.role}</span>
            <FitBars person={person} he={he} />
          </div>
          <b>96%</b>
        </article>
        <aside className="landing-stage-risks">
          <strong>{he ? "סיכונים לפני שיחה" : "Risks before the call"}</strong>
          <ul>
            <li>{he ? "ציפיית שכר גבוהה ב־8%" : "Salary band 8% above budget"}</li>
            <li>{he ? "מעדיף remote · אתם hybrid" : "Prefers remote · you are hybrid"}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function TalentsStage({ he }: { he: boolean }) {
  const reduceMotion = usePrefersReducedMotion();
  const salaryMarket = useSalaryMarket();
  const salary = salaryRangeForMarket(salaryMarket);
  const person = PEOPLE[2];
  const skills = he
    ? ["Figma", "מחקר משתמשים", "פרוטוטייפ", "מנהיגות"]
    : ["Figma", "User Research", "Prototyping", "Leadership"];

  const confetti = useMemo(() => {
    if (reduceMotion) return [];
    return Array.from({ length: 64 }, (_, i) => {
      const angle = (i / 64) * Math.PI * 2;
      const dist = 78 + (i % 9) * 16;
      return {
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        x: Math.cos(angle) * dist - 36,
        y: Math.sin(angle) * dist * 0.9,
        delay: (i % 12) * 0.05,
        size: 7 + (i % 6),
        rot: (i * 37) % 360,
        shape: i % 3 === 0 ? "curl" : i % 3 === 1 ? "bar" : "dot",
      };
    });
  }, [reduceMotion]);

  return (
    <div className="landing-stage landing-stage-talents">
      <div className="landing-stage-talent-burst" aria-hidden>
        {confetti.map((piece) => (
          <span
            key={piece.id}
            className={`landing-stage-talent-confetti is-${piece.shape}`}
            style={{
              background: piece.color,
              width: piece.size,
              height: piece.shape === "dot" ? piece.size : piece.size * 2.2,
              animationDelay: `${piece.delay}s`,
              ["--tx" as string]: `${piece.x}px`,
              ["--ty" as string]: `${piece.y}px`,
              ["--rot" as string]: `${piece.rot}deg`,
            }}
          />
        ))}
      </div>

      <article className="landing-stage-talent-card">
        <div className="landing-stage-talent-hero">
          <Image
            src={person.avatar}
            alt={person.name}
            fill
            sizes="340px"
            className="landing-stage-person-img"
            priority
          />
        </div>
        <div className="landing-stage-talent-body">
          <div className="landing-stage-talent-title">
            <h3>{person.name}</h3>
            <span className="landing-stage-free-pill">{he ? "חינם" : "Free"}</span>
          </div>
          <p className="landing-stage-talent-role">
            {he ? "מעצבת מוצר בכירה" : "Senior Product Designer"}
          </p>
          <p className="landing-stage-talent-loc">
            {he ? salary.locationHe : salary.locationEn}
          </p>

          <div className="landing-stage-skill-pills">
            {skills.map((skill, index) => (
              <span key={skill} className={`is-tone-${(index % 4) + 1}`}>
                {skill}
              </span>
            ))}
          </div>

          <div className="landing-stage-salary-block" data-salary-market={salary.market}>
            <p>
              {he ? salary.labelHe : salary.labelEn}
              <span className="landing-stage-salary-period">
                {" "}
                ({he ? salary.periodHintHe : salary.periodHintEn})
              </span>
            </p>
            <div className="landing-stage-salary-track" aria-hidden>
              <span className="landing-stage-salary-fill" />
              <span className="landing-stage-salary-knob" />
            </div>
            <div className="landing-stage-salary-meta">
              <span>{salary.low}</span>
              <span>{salary.high}</span>
            </div>
          </div>
        </div>
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
      person: PEOPLE[0],
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
          <h3>
            {he
              ? "יותר אמון. יותר נראות. יותר טאלנט."
              : "More trust. More visibility. Stronger talent."}
          </h3>
        </div>
      </header>

      <div className="landing-stage-agency-grid">
        {rows.map((row) => (
          <article
            key={row.client}
            className={`landing-stage-agency-row is-${row.tone}`}
          >
            <div className="landing-stage-agency-photo">
              <Image
                src={row.person.avatar}
                alt={row.person.name}
                fill
                sizes="56px"
                className="landing-stage-person-img"
              />
            </div>
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
