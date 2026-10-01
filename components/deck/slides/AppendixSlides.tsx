"use client";

import { FlowArrow, FlowNode, SlideShell } from "@/components/deck/SlideShell";
import { FounderPhoto } from "@/components/deck/FounderPhoto";
import { MatchScoreRing } from "@/components/matching/MatchScoreRing";

export function AppendixBusinessModelSlide() {
  return (
    <SlideShell
      kicker="Appendix · Business Model"
      title="שכבות מונטיזציה אפשריות"
      subtitle="כיוון עסקי בלי מספרים שלא מבוססים. המודל נבנה סביב ערך חוזר לחברה."
    >
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2">
        {[
          {
            title: "Hiring seats",
            body: "גישה לצוותי גיוס: משרות, Strong Matches, Why this match ושיחות.",
          },
          {
            title: "Always on relationships",
            body: "שמירת קשר עם טאלנט רלוונטי גם כשאין משרה פתוחה כרגע.",
          },
          {
            title: "Insights layer",
            body: "Analytics על דפוסי גיוס, מקורות, Match patterns ונקודות נטישה.",
          },
          {
            title: "Employee Portal + Referrals",
            body: "עובדים כערוץ גיוס וקשר פנים ארגוני שמזין את המערכת.",
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
    </SlideShell>
  );
}

export function AppendixMatchingSlide() {
  return (
    <SlideShell
      kicker="Appendix · Matching Logic"
      title="איך נבנה Fit"
      subtitle="פירוט השכבות לשיחה מעמיקה. לא חלק מהסיפור המרכזי של הפגישה."
      compact
    >
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {[
          {
            title: "Role Fit",
            items: ["Skills", "Experience", "Seniority", "Quiet signals"],
            bg: "var(--deck-light-purple)",
          },
          {
            title: "Human Fit",
            items: ["Work style", "Culture signals", "Team environment", "Collaboration"],
            bg: "var(--deck-light-blue)",
          },
          {
            title: "Motivation Fit",
            items: ["Goals", "Values", "Career direction", "Drive"],
            bg: "var(--deck-light-pink)",
          },
        ].map((col) => (
          <article key={col.title} className="deck-card p-5" style={{ background: col.bg }}>
            <h3 className="font-display text-lg font-bold">{col.title}</h3>
            <ul className="mt-4 space-y-2">
              {col.items.map((item) => (
                <li
                  key={item}
                  className="rounded-[12px] bg-white/80 px-3 py-2 text-sm font-semibold"
                >
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}

export function AppendixJourneysSlide() {
  return (
    <SlideShell
      kicker="Appendix · Journeys"
      title="שלושה מסעות באותה מערכת"
      subtitle="Candidate, Recruiter וCompany רואים את אותו Fit משלוש זוויות."
    >
      <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-3">
        {[
          {
            title: "Candidate journey",
            steps: ["Profile", "Discover", "Understand", "Mutual interest", "Connect"],
          },
          {
            title: "Recruiter journey",
            steps: ["Paste role", "Strong Matches", "Why", "Shortlist", "Conversation"],
          },
          {
            title: "Company journey",
            steps: ["Hiring need", "Signal", "Match", "Decision quality", "Relationships"],
          },
        ].map((journey) => (
          <article key={journey.title} className="deck-card p-5">
            <h3 className="font-display text-base font-bold">{journey.title}</h3>
            <div className="mt-4 flex flex-col items-stretch gap-2">
              {journey.steps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: "var(--deck-gradient)" }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold">{step}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}

export function AppendixProductExtrasSlide() {
  return (
    <SlideShell
      kicker="Appendix · Product"
      title="שכבות מוצר נוספות"
      subtitle="Employee Portal, Referrals וAnalytics כחלק מהחזון הרחב."
    >
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-3">
        {[
          {
            title: "Employee Portal",
            body: "עובדים כחלק ממערכת היחסים של החברה עם טאלנט.",
          },
          {
            title: "Referrals",
            body: "המלצות שמגיעות מתוך הבנה, לא רק מתוך רשימת אנשי קשר.",
          },
          {
            title: "Advanced Analytics",
            body: "דפוסי גיוס, מקורות חזקים, ופערים שחוזרים על עצמם.",
          },
        ].map((card) => (
          <article key={card.title} className="deck-soft-panel p-6">
            <h3 className="font-display text-lg font-bold">{card.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}

export function AppendixGtmSlide() {
  return (
    <SlideShell
      kicker="Appendix · Go To Market"
      title="איך נכנסים לשוק"
      subtitle="התחלה עם צוותי גיוס ומייסדים שמגייסים, והרחבה לשכבות Relationship."
    >
      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <FlowNode title="Founders" caption="hiring lean" tone="pink" />
          <FlowArrow />
          <FlowNode title="HR teams" caption="signal quality" tone="purple" />
          <FlowArrow />
          <FlowNode title="Recruiters" caption="shortlists" tone="blue" />
          <FlowArrow />
          <FlowNode title="Companies" caption="relationships" tone="gradient" />
        </div>
        <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
          {[
            {
              title: "Beachhead",
              body: "חברות וצוותים שצריכים shortlist מוסבר מהר, בלי עוד ATS כבד.",
            },
            {
              title: "Expansion",
              body: "ממשרה בודדת לשימוש מתמשך בTalent Relationship וInsights.",
            },
            {
              title: "Moat",
              body: "Data וRelationships שנצברים עם הזמן משפרים Match והבנה.",
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

export function AppendixRoadmapSlide() {
  return (
    <SlideShell
      kicker="Appendix · Roadmap"
      title="כיוון מוצר"
      subtitle="סדר עדיפויות ברור: להעמיק את Fit, להרחיב Relationship, ואז Insights."
    >
      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {[
          {
            phase: "Now",
            title: "Match quality",
            body: "Mutual Matching, Why this match, ושיחות שמתחילות מהבנה.",
          },
          {
            phase: "Next",
            title: "Relationship layer",
            body: "חיבור מתמשך, Referrals, ושימוש גם מעבר למשרה פתוחה.",
          },
          {
            phase: "Later",
            title: "Insights platform",
            body: "Analytics עמוק יותר לצוותי People וRecruitment.",
          },
        ].map((card) => (
          <article key={card.phase} className="deck-card p-5">
            <p className="deck-pill">{card.phase}</p>
            <h3 className="mt-4 font-display text-lg font-bold">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
              {card.body}
            </p>
          </article>
        ))}
      </div>
    </SlideShell>
  );
}

export function AppendixCompetitiveSlide() {
  return (
    <SlideShell
      kicker="Appendix · Landscape"
      title="איפה mingle שונה"
      subtitle="רוב הכלים עוזרים לנהל תהליך או לחפש אנשים. mingle מסבירה למה כדאי לדבר."
    >
      <div className="flex w-full max-w-5xl flex-col gap-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {["PeopleForce", "ATS", "Job boards", "Keyword search"].map(
            (name) => (
              <span key={name} className="deck-pill">
                {name}
              </span>
            ),
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="deck-card p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-secondary)]">
              Landscape
            </p>
            <h3 className="mt-2 font-display text-lg font-bold">
              PeopleForce וכלים דומים
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[color:var(--deck-secondary)]">
              <li>HR suite וניהול תהליך גיוס</li>
              <li>ארגון מועמדים, משרות וWorkflow</li>
              <li>חיפוש וסינון לפי מילות מפתח</li>
              <li>פחות דגש על למה באמת יש Fit</li>
            </ul>
          </article>
          <article className="deck-soft-panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--deck-purple)]">
              mingle
            </p>
            <h3 className="mt-2 font-display text-lg font-bold">
              Explained Mutual Matching
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[color:var(--deck-dark)]">
              <li>Strong Matches עם Why this match</li>
              <li>Role · Human · Motivation Fit</li>
              <li>Potential gaps לפני השיחה</li>
              <li>Relationship layer לפני ואחרי ההעסקה</li>
            </ul>
          </article>
        </div>

        <p className="text-center text-sm font-medium text-[color:var(--deck-secondary)]">
          לא מחליפים מערכת HR. מוסיפים שכבת הבנה שחסרה לפני החיבור.
        </p>
      </div>
    </SlideShell>
  );
}

export function AppendixFounderSlide() {
  return (
    <SlideShell
      kicker="Appendix · Founder"
      title="רקע מורחב"
      subtitle="פירוט נוסף אם עולה שאלה על המייסדת או על החיבור לבעיה."
    >
      <div className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
        <FounderPhoto size={112} />
        <div>
          <p className="font-display text-2xl font-bold">ירין כהן</p>
          <p className="mt-1 text-sm font-semibold text-[color:var(--deck-purple)]">
            Founder · HR · Recruitment · People · Tech
          </p>
        </div>
        <p className="max-w-2xl text-base leading-relaxed text-[color:var(--deck-secondary)]">
          השילוב בין עולם האנשים לבין בניית מוצר טכנולוגי הוא לב mingle.
          לא מספיק למצוא אנשים. צריך להבין אם באמת קיים Fit לפני שמחברים.
        </p>
      </div>
    </SlideShell>
  );
}

export function AppendixQaSlide() {
  return (
    <SlideShell
      kicker="Appendix · Q&A"
      title="שאלות נפוצות"
      subtitle="תשובות קצרות לשיחה אחרי הסיפור המרכזי."
      compact
    >
      <div className="grid w-full max-w-5xl gap-3 md:grid-cols-2">
        {[
          {
            q: "האם mingle מחליפה ראיון?",
            a: "לא. היא מחליפה את הרשימה הרועשת ומכינה שיחה טובה יותר.",
          },
          {
            q: "מה שונה מאלגוריתם Match רגיל?",
            a: "שקיפות. Role, Human וMotivation עם Why וPotential gaps.",
          },
          {
            q: "למי המוצר קודם כל?",
            a: "לצוותי גיוס ומייסדים שמגייסים. למועמדים זה חינם.",
          },
          {
            q: "מה הNext Stage?",
            a: "העמקת Product Market Fit והרחבת שכבת Relationship.",
          },
        ].map((item) => (
          <article key={item.q} className="deck-card p-5">
            <h3 className="font-display text-sm font-bold">{item.q}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--deck-secondary)]">
              {item.a}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-center gap-3">
        <MatchScoreRing score={94} size={56} showLabel />
        <p className="text-sm font-semibold text-[color:var(--deck-secondary)]">
          Beyond the match.
        </p>
      </div>
    </SlideShell>
  );
}
