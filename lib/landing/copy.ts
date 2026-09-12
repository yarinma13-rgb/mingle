export type LandingLocale = "en" | "he";

export type AudienceId =
  | "companies"
  | "recruiters"
  | "founders"
  | "talent"
  | "agencies";

export type LandingCopy = {
  dir: "ltr" | "rtl";
  nav: {
    why: string;
    how: string;
    whyMatch: string;
    compare: string;
    faq: string;
    signIn: string;
    bookDemo: string;
  };
  lang: { en: string; he: string; aria: string };
  hero: {
    eyebrow: string;
    titleLines: [string, string, string];
    value: string;
    getStarted: string;
    bookDemo: string;
    getStartedHint: string;
    bookDemoHint: string;
    freeTalent: string;
    audiences: { id: AudienceId; label: string; lead: string }[];
  };
  why: {
    title: string;
    lead: string;
    cards: { title: string; body: string }[];
  };
  how: {
    title: string;
    lead: string;
    steps: { title: string; body: string }[];
  };
  whyMatch: {
    title: string;
    lead: string;
    bullets: string[];
    cardTitle: string;
    cardBadge: string;
    reasons: { text: string; tone: "good" | "warn" }[];
  };
  scores: {
    title: string;
    lead: string;
    bullets: string[];
    cardTitle: string;
    cardBadge: string;
    overall: string;
    role: string;
    human: string;
    motivation: string;
  };
  dna: {
    title: string;
    lead: string;
    cards: { title: string; body: string }[];
  };
  moment: {
    eyebrow: string;
    title: string;
    lead: string;
    bullets: string[];
    unlocked: string;
    scoresLine: string;
  };
  compare: {
    title: string;
    lead: string;
    columns: [string, string, string, string];
    rows: {
      feature: string;
      mingle: string;
      ats: string;
      linkedin: string;
    }[];
  };
  faq: {
    title: string;
    lead: string;
    items: { q: string; a: string }[];
  };
  banner: {
    title: string;
    lead: string;
    getStarted: string;
    bookDemo: string;
    freeLine: string;
  };
  footer: {
    product: string;
    company: string;
    legal: string;
    why: string;
    how: string;
    compare: string;
    faq: string;
    bookDemo: string;
    contact: string;
    signIn: string;
    terms: string;
    privacy: string;
    freeTalent: string;
    rights: string;
  };
};

export const LANDING_COPY: Record<LandingLocale, LandingCopy> = {
  en: {
    dir: "ltr",
    nav: {
      why: "Why mingle",
      how: "How it works",
      whyMatch: "Why this match",
      compare: "Compare",
      faq: "FAQ",
      signIn: "Sign in",
      bookDemo: "Book a demo",
    },
    lang: { en: "EN", he: "עב", aria: "Language" },
    hero: {
      eyebrow: "Built for hiring teams. Open to talent too.",
      titleLines: ["Post a role.", "Meet the right people.", "See why it fits."],
      value:
        "Hiring teams move with near zero friction. Talent gets matched with clear reasons, not black box scores.",
      getStarted: "Get Started",
      bookDemo: "Book a demo",
      getStartedHint: "Self-serve signup. Open your first Match Report in minutes.",
      bookDemoHint: "A live walkthrough on a real open role with your team.",
      freeTalent: "Free for talent. Talk to us for hiring teams.",
      audiences: [
        {
          id: "companies",
          label: "Companies",
          lead: "Paste a job description. In seconds, see the few people worth talking to — with a clear Why this match.",
        },
        {
          id: "recruiters",
          label: "Recruiters",
          lead: "Skip the questionnaire. mingle asks only when something critical is missing, then ranks people worth your time.",
        },
        {
          id: "founders",
          label: "Founders",
          lead: "Open a hard-to-fill role. Get Top Matches with Role, Human, and Motivation Fit — plus risks before the first call.",
        },
        {
          id: "talent",
          label: "Talent",
          lead: "Your Candidate DNA is inferred from what you already share. When interest is mutual, both sides see why.",
        },
        {
          id: "agencies",
          label: "Agencies",
          lead: "Send clients fewer CVs and more explained matches — Role, Human, Motivation Fit, and Match Confidence together.",
        },
      ],
    },
    why: {
      title: "Less friction. More signal.",
      lead: "Infer what you can. Ask only what is critical. Explain every recommendation.",
      cards: [
        {
          title: "Sixty second start",
          body: "Paste a job description or role link. No culture questionnaire. No fifteen-field onboarding.",
        },
        {
          title: "DNA, not forms",
          body: "Company, Candidate, and Role DNA build from jobs, profiles, signals, and outcomes — not surveys.",
        },
        {
          title: "Ask only when stuck",
          body: "If something critical is unclear, mingle asks one short question. Then it ranks.",
        },
      ],
    },
    how: {
      title: "From role to shortlist",
      lead: "Fewer CVs. Better conversations. Mutual interest unlocks Why this match for both sides.",
      steps: [
        {
          title: "Paste the job",
          body: "Drop in a description or link. mingle extracts role, seniority, skills, must-haves, and quiet signals.",
        },
        {
          title: "Get Strong Matches",
          body: "Ranked people with Overall Match, Role Fit, Human Fit, Motivation Fit, and Match Confidence.",
        },
        {
          title: "Read Why this match",
          body: "See strengths, the one real risk, and why this person deserves your time.",
        },
        {
          title: "Mark interest",
          body: "Interested or not relevant. Mutual interest unlocks the conversation. Outcomes teach the Learning Engine.",
        },
      ],
    },
    whyMatch: {
      title: "Why this match?",
      lead: "Not another black box percentage. Both sides see why — including the risk that could break it.",
      bullets: [
        "Skills, stage, ownership, salary, and career direction",
        "One honest concern when preferences may clash",
        "Match Confidence so a thin profile never looks certain",
      ],
      cardTitle: "Why mingle recommends this candidate",
      cardBadge: "96% · High confidence",
      reasons: [
        { text: "5/5 core skills", tone: "good" },
        { text: "Experience in a similar company stage", tone: "good" },
        { text: "Looking for high ownership", tone: "good" },
        { text: "Your role offers exactly that", tone: "good" },
        { text: "Salary expectations align", tone: "good" },
        { text: "Career direction matches the role", tone: "good" },
        {
          text: "Prefers remote-first work. This role asks for 3 office days.",
          tone: "warn",
        },
      ],
    },
    scores: {
      title: "Three scores. One overall.",
      lead: "Can they do it. Will they thrive. Do they want it.",
      bullets: [
        "DNA-to-DNA matching, not only CV to job description",
        "Confidence that stays humble when data is thin",
        "A shared language before anyone books an interview",
      ],
      cardTitle: "Three scores. One overall.",
      cardBadge: "94% Match",
      overall: "Overall · High confidence",
      role: "Role Fit",
      human: "Human Fit",
      motivation: "Motivation Fit",
    },
    dna: {
      title: "Three DNAs. One match.",
      lead: "Culture still matters. Forms should not come first.",
      cards: [
        {
          title: "Company DNA",
          body: "Work style, management, environment, and what succeeds here — from jobs, signals, and outcomes.",
        },
        {
          title: "Candidate DNA",
          body: "Skills, trajectory, preferences, and goals from CV, profile, applications, and feedback.",
        },
        {
          title: "Role DNA",
          body: "Explicit requirements plus quiet ones — like high autonomy when a job says work closely with founders.",
        },
      ],
    },
    moment: {
      eyebrow: "After mutual interest",
      title: "Conversation becomes signal",
      lead: "Matching comes first. When both sides are interested, a short mingle chat can surface alignment and the next useful question.",
      bullets: [
        "Mutual interest before the first deep chat",
        "A Match Report both sides can read",
        "Outcomes that teach the Learning Engine over time",
      ],
      unlocked: "Mutual interest unlocked",
      scoresLine: "Role 97 · Human 92 · Motivation 94",
    },
    compare: {
      title: "Where mingle wins",
      lead: "Built for explained shortlists — not another pile of CVs.",
      columns: ["", "mingle", "Typical ATS", "LinkedIn Recruiter"],
      rows: [
        {
          feature: "Why this match",
          mingle: "Clear reasons + one honest risk",
          ats: "Keyword / stage status",
          linkedin: "Search filters, little why",
        },
        {
          feature: "DNA matching",
          mingle: "Company + Candidate + Role",
          ats: "Mostly CV ↔ job text",
          linkedin: "Profile keywords",
        },
        {
          feature: "Questions asked",
          mingle: "Only when stuck",
          ats: "Long intake forms",
          linkedin: "You do the filtering",
        },
        {
          feature: "Match Confidence",
          mingle: "Shown when data is thin",
          ats: "Rarely transparent",
          linkedin: "Not a fit score",
        },
        {
          feature: "Mutual interest",
          mingle: "Before deep conversation",
          ats: "After apply / screen",
          linkedin: "InMail first",
        },
        {
          feature: "For talent",
          mingle: "Free",
          ats: "Usually employer-only",
          linkedin: "Freemium / Premium",
        },
      ],
    },
    faq: {
      title: "Questions, answered",
      lead: "Short answers before you try mingle.",
      items: [
        {
          q: "Is mingle free for talent?",
          a: "Yes. Talent uses mingle free. Hiring teams talk to us for access and demos.",
        },
        {
          q: "How is this different from an ATS or LinkedIn Recruiter?",
          a: "Those help you store or search people. mingle ranks a short list and explains Why this match — Role, Human, and Motivation Fit — with Match Confidence.",
        },
        {
          q: "What is Match Confidence?",
          a: "It shows how sure mingle is. Low confidence means the signal is thin — still useful, never oversold.",
        },
        {
          q: "What happens after mutual interest?",
          a: "A human is still involved. Mutual interest unlocks conversation and a shared Match Report. mingle does not replace interviews.",
        },
        {
          q: "What data builds Company and Candidate DNA?",
          a: "Jobs, profiles, applications, interactions, and outcomes. Private, used to improve matching — not sold as a résumé feed.",
        },
        {
          q: "Does mingle replace the interview?",
          a: "No. It replaces the noisy shortlist. Interviews stay where real decisions happen.",
        },
        {
          q: "Get Started vs Book a demo?",
          a: "Get Started is self-serve signup. Book a demo is a live walkthrough on a real open role with your team.",
        },
      ],
    },
    banner: {
      title: "The right people, faster.",
      lead: "A clearer short list, with reasons both sides can trust.",
      getStarted: "Get Started",
      bookDemo: "Book a demo",
      freeLine: "Free for talent. Hiring teams — talk to us.",
    },
    footer: {
      product: "Product",
      company: "Company",
      legal: "Legal",
      why: "Why mingle",
      how: "How it works",
      compare: "Compare",
      faq: "FAQ",
      bookDemo: "Book a demo",
      contact: "Contact",
      signIn: "Sign in",
      terms: "Terms",
      privacy: "Privacy",
      freeTalent: "Free for talent",
      rights: "mingle",
    },
  },
  he: {
    dir: "rtl",
    nav: {
      why: "למה mingle",
      how: "איך זה עובד",
      whyMatch: "למה ההתאמה",
      compare: "השוואה",
      faq: "שאלות",
      signIn: "התחברות",
      bookDemo: "קביעת דמו",
    },
    lang: { en: "EN", he: "עב", aria: "שפה" },
    hero: {
      eyebrow: "נבנה לצוותי גיוס. פתוח גם למועמדים.",
      titleLines: ["מפרסמים תפקיד.", "פוגשים את האנשים הנכונים.", "רואים למה זה מתאים."],
      value:
        "צוותי גיוס זזים כמעט בלי חיכוך. מועמדים מקבלים התאמות עם סיבות ברורות — לא ציון קופסה שחורה.",
      getStarted: "להתחיל",
      bookDemo: "קביעת דמו",
      getStartedHint: "הרשמה עצמאית. דוח ההתאמה הראשון תוך דקות.",
      bookDemoHint: "סיור חי על משרה אמיתית פתוחה עם הצוות שלכם.",
      freeTalent: "חינם למועמדים. צוותי גיוס — דברו איתנו.",
      audiences: [
        {
          id: "companies",
          label: "חברות",
          lead: "מדביקים תיאור משרה. תוך שניות רואים את האנשים שבאמת שווה לדבר איתם — עם למה ההתאמה.",
        },
        {
          id: "recruiters",
          label: "מגייסים",
          lead: "בלי שאלון ארוך. mingle שואל רק כשמשהו קריטי חסר, ואז מדרג אנשים ששווים את הזמן שלכם.",
        },
        {
          id: "founders",
          label: "מייסדים",
          lead: "פותחים משרה קשה. מקבלים Top Matches עם התאמת תפקיד, אדם ומוטיבציה — כולל סיכונים לפני השיחה הראשונה.",
        },
        {
          id: "talent",
          label: "מועמדים",
          lead: "ה־DNA של המועמד נבנה ממה שכבר משתפים. כשיש עניין הדדי, שני הצדדים רואים למה.",
        },
        {
          id: "agencies",
          label: "סוכנויות",
          lead: "שולחים ללקוחות פחות קורות חיים ויותר התאמות מוסברות — תפקיד, אדם, מוטיבציה וביטחון בהתאמה.",
        },
      ],
    },
    why: {
      title: "פחות חיכוך. יותר סיגנל.",
      lead: "מסיקים מה שאפשר. שואלים רק את הקריטי. מסבירים כל המלצה.",
      cards: [
        {
          title: "התחלה ב־60 שניות",
          body: "מדביקים תיאור משרה או קישור. בלי שאלון תרבות. בלי אונבורדינג ארוך.",
        },
        {
          title: "DNA, לא טפסים",
          body: "DNA של חברה, מועמד ותפקיד נבנה ממשרות, פרופילים, סיגנלים ותוצאות — לא מסקרים.",
        },
        {
          title: "שואלים רק כשנתקעים",
          body: "אם משהו קריטי לא ברור, mingle שואל שאלה קצרה אחת. ואז מדרג.",
        },
      ],
    },
    how: {
      title: "מתפקיד לרשימה קצרה",
      lead: "פחות קורות חיים. שיחות טובות יותר. עניין הדדי פותח את למה ההתאמה לשני הצדדים.",
      steps: [
        {
          title: "מדביקים את המשרה",
          body: "תיאור או קישור. mingle שולף תפקיד, בכירות, כישורים, חובה וסיגנלים שקטים.",
        },
        {
          title: "מקבלים התאמות חזקות",
          body: "אנשים מדורגים עם התאמה כללית, תפקיד, אדם, מוטיבציה וביטחון בהתאמה.",
        },
        {
          title: "קוראים למה ההתאמה",
          body: "רואים חוזקות, סיכון אמיתי אחד, ולמה האדם הזה שווה את הזמן שלכם.",
        },
        {
          title: "מסמנים עניין",
          body: "מעניין או לא רלוונטי. עניין הדדי פותח שיחה. תוצאות מלמדות את מנוע הלמידה.",
        },
      ],
    },
    whyMatch: {
      title: "למה ההתאמה?",
      lead: "לא עוד אחוז קופסה שחורה. שני הצדדים רואים למה — כולל הסיכון שיכול לשבור את זה.",
      bullets: [
        "כישורים, שלב חברה, בעלות, שכר וכיוון קריירה",
        "חשש כנה אחד כשהעדפות עלולות להתנגש",
        "ביטחון בהתאמה — כדי שפרופיל דק לא ייראה ודאי",
      ],
      cardTitle: "למה mingle ממליץ על המועמד",
      cardBadge: "96% · ביטחון גבוה",
      reasons: [
        { text: "5/5 כישורים ליבה", tone: "good" },
        { text: "ניסיון בשלב חברה דומה", tone: "good" },
        { text: "מחפש בעלות גבוהה", tone: "good" },
        { text: "התפקיד שלכם מציע בדיוק את זה", tone: "good" },
        { text: "ציפיות שכר מיושרות", tone: "good" },
        { text: "כיוון קריירה תואם לתפקיד", tone: "good" },
        {
          text: "מעדיף רימוט־פרסט. התפקיד מבקש 3 ימים במשרד.",
          tone: "warn",
        },
      ],
    },
    scores: {
      title: "שלושה ציונים. אחד כללי.",
      lead: "האם יכולים. האם ישגשגו. האם רוצים.",
      bullets: [
        "התאמת DNA ל־DNA, לא רק קו״ח לתיאור משרה",
        "ביטחון שנשאר צנוע כשהמידע דק",
        "שפה משותפת לפני שקובעים ראיון",
      ],
      cardTitle: "שלושה ציונים. אחד כללי.",
      cardBadge: "94% התאמה",
      overall: "כללי · ביטחון גבוה",
      role: "התאמת תפקיד",
      human: "התאמת אדם",
      motivation: "התאמת מוטיבציה",
    },
    dna: {
      title: "שלושה DNA. התאמה אחת.",
      lead: "תרבות עדיין חשובה. טפסים לא צריכים לבוא קודם.",
      cards: [
        {
          title: "DNA חברה",
          body: "סגנון עבודה, ניהול, סביבה ומה מצליח כאן — ממשרות, סיגנלים ותוצאות.",
        },
        {
          title: "DNA מועמד",
          body: "כישורים, מסלול, העדפות ומטרות — מקו״ח, פרופיל, מועמדויות ופידבק.",
        },
        {
          title: "DNA תפקיד",
          body: "דרישות מפורשות ועוד שקטות — כמו אוטונומיה גבוהה כשכתוב לעבוד צמוד למייסדים.",
        },
      ],
    },
    moment: {
      eyebrow: "אחרי עניין הדדי",
      title: "השיחה הופכת לסיגנל",
      lead: "קודם התאמה. כששני הצדדים מעוניינים, שיחה קצרה יכולה לחשוף יישור ואת השאלה הבאה ששווה.",
      bullets: [
        "עניין הדדי לפני השיחה העמוקה הראשונה",
        "דוח התאמה ששני הצדדים יכולים לקרוא",
        "תוצאות שמלמדות את מנוע הלמידה לאורך זמן",
      ],
      unlocked: "עניין הדדי נפתח",
      scoresLine: "תפקיד 97 · אדם 92 · מוטיבציה 94",
    },
    compare: {
      title: "איפה mingle חזק יותר",
      lead: "נבנה לרשימות קצרות מוסברות — לא לעוד ערמת קורות חיים.",
      columns: ["", "mingle", "ATS טיפוסי", "LinkedIn Recruiter"],
      rows: [
        {
          feature: "למה ההתאמה",
          mingle: "סיבות ברורות + סיכון כנה",
          ats: "מילות מפתח / סטטוס",
          linkedin: "פילטרים, כמעט בלי למה",
        },
        {
          feature: "התאמת DNA",
          mingle: "חברה + מועמד + תפקיד",
          ats: "בעיקר קו״ח ↔ טקסט משרה",
          linkedin: "מילות מפתח בפרופיל",
        },
        {
          feature: "שאלות שנשאלות",
          mingle: "רק כשנתקעים",
          ats: "טפסי קליטה ארוכים",
          linkedin: "אתם עושים את הסינון",
        },
        {
          feature: "ביטחון בהתאמה",
          mingle: "מוצג כשהמידע דק",
          ats: "לעיתים רחוקות שקוף",
          linkedin: "לא ציון התאמה",
        },
        {
          feature: "עניין הדדי",
          mingle: "לפני שיחה עמוקה",
          ats: "אחרי הגשה / סינון",
          linkedin: "קודם InMail",
        },
        {
          feature: "למועמדים",
          mingle: "חינם",
          ats: "בדרך כלל רק למעסיק",
          linkedin: "Freemium / Premium",
        },
      ],
    },
    faq: {
      title: "שאלות נפוצות",
      lead: "תשובות קצרות לפני שמתחילים.",
      items: [
        {
          q: "האם mingle חינם למועמדים?",
          a: "כן. מועמדים משתמשים בחינם. צוותי גיוס מדברים איתנו על גישה ודמו.",
        },
        {
          q: "במה זה שונה מ־ATS או LinkedIn Recruiter?",
          a: "הם עוזרים לאחסן או לחפש אנשים. mingle מדרג רשימה קצרה ומסביר למה ההתאמה — תפקיד, אדם ומוטיבציה — עם ביטחון בהתאמה.",
        },
        {
          q: "מה זה ביטחון בהתאמה?",
          a: "כמה mingle בטוח. ביטחון נמוך אומר שהסיגנל דק — עדיין שימושי, בלי למכור ודאות מזויפת.",
        },
        {
          q: "מה קורה אחרי עניין הדדי?",
          a: "עדיין מעורב אדם. עניין הדדי פותח שיחה ודוח התאמה משותף. mingle לא מחליף ראיונות.",
        },
        {
          q: "מאילו נתונים נבנה DNA?",
          a: "משרות, פרופילים, מועמדויות, אינטראקציות ותוצאות. הנתונים פרטיים ומשמשים לשיפור התאמות — לא נמכרים כמאגר קורות חיים.",
        },
        {
          q: "האם mingle מחליף את הראיון?",
          a: "לא. הוא מחליף את הרשימה הרועשת. הראיונות נשארים המקום להחלטות אמיתיות.",
        },
        {
          q: "להתחיל מול קביעת דמו?",
          a: "להתחיל זה הרשמה עצמאית. קביעת דמו זה סיור חי על משרה אמיתית עם הצוות שלכם.",
        },
      ],
    },
    banner: {
      title: "האנשים הנכונים, מהר יותר.",
      lead: "רשימה קצרה וברורה, עם סיבות ששני הצדדים יכולים לסמוך עליהן.",
      getStarted: "להתחיל",
      bookDemo: "קביעת דמו",
      freeLine: "חינם למועמדים. צוותי גיוס — דברו איתנו.",
    },
    footer: {
      product: "מוצר",
      company: "חברה",
      legal: "משפטי",
      why: "למה mingle",
      how: "איך זה עובד",
      compare: "השוואה",
      faq: "שאלות",
      bookDemo: "קביעת דמו",
      contact: "צור קשר",
      signIn: "התחברות",
      terms: "תנאים",
      privacy: "פרטיות",
      freeTalent: "חינם למועמדים",
      rights: "mingle",
    },
  },
};
