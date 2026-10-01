export type PitchFolderId =
  | "founder"
  | "problem"
  | "solution"
  | "why-now"
  | "market"
  | "competition"
  | "business"
  | "validation"
  | "roadmap"
  | "ask";

export type PitchSceneVisual =
  | "title"
  | "quote"
  | "bullets"
  | "stats"
  | "two-sides"
  | "funnel"
  | "match-gauge"
  | "pillars"
  | "pricing"
  | "competitors"
  | "timeline"
  | "ask-split"
  | "chips"
  | "closing";

export type PitchScene = {
  id: string;
  durationMs: number;
  eyebrow?: string;
  title: string;
  highlight?: string;
  body?: string;
  bullets?: string[];
  stats?: { value: string; label: string }[];
  chips?: string[];
  left?: { title: string; items: string[] };
  right?: { title: string; items: string[] };
  pillars?: { title: string; body: string }[];
  rows?: { name: string; category: string; gap: string; highlight?: boolean }[];
  plans?: {
    name: string;
    jobs: string;
    price: string;
    yearly: string;
    committed: string;
    includes: string;
    benchmark: string;
  }[];
  milestones?: { when: string; what: string }[];
  visual: PitchSceneVisual;
};

export type PitchFolder = {
  id: PitchFolderId;
  order: number;
  labelHe: string;
  labelEn: string;
  tagline: string;
  accent: "pink" | "purple" | "blue" | "magenta";
  durationLabel: string;
  preview?: string;
  scenes: PitchScene[];
};

/** ~50s films — denser copy lives here so the folder grid stays light. */
export const PITCH_FOLDERS: PitchFolder[] = [
  {
    id: "founder",
    order: 1,
    labelHe: "עליי",
    labelEn: "The Founder",
    tagline: "מי חיה את הבעיה משני הצדדים",
    accent: "purple",
    durationLabel: "50 שנ׳",
    preview: "/investors/87cf62ed-43b6-4029-aa40-633737f2f8b9.jpg",
    scenes: [
      {
        id: "f1",
        durationMs: 5500,
        eyebrow: "01 · The Founder",
        title: "ירין",
        highlight: "Ideas are what shape the world",
        body: "נבנה על ידי מי שחיה את בעיית ההתאמה — מגייסת, HR, וגם מועמדת.",
        visual: "quote",
      },
      {
        id: "f2",
        durationMs: 6500,
        eyebrow: "Lived experience",
        title: "שלושה כובעים. אותה בעיה.",
        bullets: [
          "מגייסת ללקוחות — ראיתי איך חברות מפסידות זמן על מועמדים שלא מתאימים לתרבות ולצוות.",
          "מגייסת In-house ו־HR — חייתי את הלחץ למלא תקן פתוח במועמד הנכון, לא רק במועמד הזמין.",
          "מועמדת — חוויתי חוסר שקיפות, חוסר ודאות, ופער בין מה שנאמר בראיון לבין היום־יום בעבודה.",
        ],
        visual: "bullets",
      },
      {
        id: "f3",
        durationMs: 6000,
        eyebrow: "The insight",
        title: "חסרה שקיפות. חסרה ודאות. חסרה התאמה.",
        body: "ראיונות מתנהלים בצורה מסוימת, אנשים מתראיינים בצורה מסוימת — ואז מגיע היום־יום ויש פערים. האינטואיציה לבדה כבר לא מספיקה.",
        chips: [
          "Process opacity",
          "Interview theater",
          "Day-1 reality gap",
          "Gut ≠ data",
        ],
        visual: "chips",
      },
      {
        id: "f4",
        durationMs: 5500,
        eyebrow: "Domain depth",
        title: "Built from the inside",
        stats: [
          { value: "1,000+", label: "החלטות גיוס שנצפו" },
          { value: "10+", label: "חברות שנחשפו לבעיה" },
          { value: "100+", label: "ראיונות עם HR / מגייסות / מנהלים" },
          { value: "MVP", label: "מאומת עם משתמשים מוקדמים" },
        ],
        visual: "stats",
      },
      {
        id: "f5",
        durationMs: 5500,
        eyebrow: "Why this founder",
        title: "היתרון הוא לדעת מה לבנות",
        bullets: [
          "Deep domain exposure — HR, recruitment, employee experience ו־organizational fit.",
          "First-hand understanding of both sides — מועמדים, מגייסות, מנהלים וחברות.",
          "Speed of execution — תרגום מהיר של כאב HR לדרישות מוצר ולזרימות עבודה.",
        ],
        visual: "bullets",
      },
      {
        id: "f6",
        durationMs: 5000,
        eyebrow: "Founder thesis",
        title: "הגיע הזמן להעביר אינטואיציה לעובדות.",
        highlight: "From intuition → data + AI facts",
        body: "mingle נולדה מהפער בין איך שמגייסים היום — לבין איך שאפשר לגייס כשיודעים מראש מידת התאמה, פערים, וגמישות.",
        visual: "closing",
      },
    ],
  },
  {
    id: "problem",
    order: 2,
    labelHe: "הבעיה",
    labelEn: "The Problem",
    tagline: "פערי שוק, עומס גיוס, והיעדר Fit אמיתי",
    accent: "pink",
    durationLabel: "50 שנ׳",
    preview: "/investors/be834461-28e2-4a80-9fc2-69d4ed32f940.jpg",
    scenes: [
      {
        id: "p1",
        durationMs: 5000,
        eyebrow: "02 · The Problem",
        title: "Fit is still hard to understand",
        body: "יש יותר מועמדים טובים בשוק — ופחות מקום לטעות בכל גיוס.",
        visual: "title",
      },
      {
        id: "p2",
        durationMs: 7000,
        eyebrow: "Market pressure",
        title: "שני צדדים תחת לחץ",
        left: {
          title: "המועמדים",
          items: [
            "גל פיטורים + AI + מילואים דחפו כישרון חזק לחיפוש עבודה.",
            "מועמדים מחפשים דרכים להתבלט מעבר ל־CV.",
            "שקיפות נמוכה בתהליך → תסכול ו־drop-off.",
          ],
        },
        right: {
          title: "החברות",
          items: [
            "צמצום תקנים — כל Headcount פתוח הוא קריטי.",
            "הלחץ: למלא את התקן במועמד הכי מתאים — לא הכי מהיר.",
            "גיוס שגוי עולה בזמן, כסף, ומומנטום צוות.",
          ],
        },
        visual: "two-sides",
      },
      {
        id: "p3",
        durationMs: 6500,
        eyebrow: "Retention angle",
        title: "התאמה אמיתית = כלי שימור",
        body: "בשווקים תחרותיים, מועמדים שמוצאים Fit אמיתי נשארים — לפחות לתפקיד משמעותי של ~3 שנים — במקום לקפוץ על HR benefits או salary בלבד.",
        chips: [
          "Quality of hire",
          "3-year stickiness",
          "Less job-hopping",
          "Culture lock-in",
        ],
        visual: "chips",
      },
      {
        id: "p4",
        durationMs: 7000,
        eyebrow: "Tooling gap",
        title: "כמעט אין כלים שמבדילים לפי Fit עמוק",
        bullets: [
          "רוב הכלים מסתכלים על ניסיון מקצועי / keywords — לא על התאמה לחברה, לתפקיד ולצוות.",
          "מגייסות נשארות עם סינון CV → מיון → טלפוני → פרונטלי → משימות — תהליך כבד ויקר.",
          "שאלות גנריות נשארות בלופ, במקום שיחה שמתחילה ממידת התאמה ופערים.",
        ],
        visual: "bullets",
      },
      {
        id: "p5",
        durationMs: 6500,
        eyebrow: "The funnel tax",
        title: "המשפך עדיין רץ על אינטואיציה",
        left: {
          title: "היום",
          items: [
            "CV → Screening → Interview → Intuition → Hire",
            "אלפי מועמדים למעלה, אחד למטה — בלי הסבר Fit.",
            "זמן יקר על מועמדים שלא היו צריכים להגיע לשלבים מתקדמים.",
          ],
        },
        right: {
          title: "מה חסר",
          items: [
            "Score של התאמה לפני השיחה הראשונה",
            "Why Match / Why Not + פערים פוטנציאליים",
            "רקע עשיר בסריקה של שניות: זמינות, דיסקרטיות, המלצות",
          ],
        },
        visual: "funnel",
      },
      {
        id: "p6",
        durationMs: 5000,
        eyebrow: "Bottom line",
        title: "הבעיה האמיתית אינה מחסור בכישרון",
        highlight: "זו בעיית התאמה הדדית",
        body: "Person ↔ Company ↔ Role ↔ Team — בלי שכבת אינטליגנציה שמבינה את שני הצדדים.",
        visual: "closing",
      },
    ],
  },
  {
    id: "solution",
    order: 3,
    labelHe: "הפתרון",
    labelEn: "The Solution",
    tagline: "mingle — Mutual Match Intelligence",
    accent: "magenta",
    durationLabel: "50 שנ׳",
    preview: "/investors/222092bb-1b46-49eb-9494-4a2c8341c4ff.jpg",
    scenes: [
      {
        id: "s1",
        durationMs: 5000,
        eyebrow: "03 · The Solution",
        title: "The match is simple.",
        highlight: "The intelligence behind it isn’t.",
        body: "mingle אינה עוד AI feature על ATS — זו שכבת אינטליגנציה חדשה להבנת שני צידי מערכת היחסים התעסוקתית.",
        visual: "title",
      },
      {
        id: "s2",
        durationMs: 6500,
        eyebrow: "Two-sided understanding",
        title: "יותר מ־CV. יותר מ־JD.",
        left: {
          title: "האדם",
          items: [
            "Skills & Experience",
            "Goals & Motivation",
            "Work Style",
            "Values & Preferences",
          ],
        },
        right: {
          title: "החברה",
          items: [
            "Role & Skills",
            "Culture & Values",
            "Expectations",
            "Environment",
          ],
        },
        visual: "two-sides",
      },
      {
        id: "s3",
        durationMs: 7000,
        eyebrow: "Mingle Intelligence",
        title: "חמש שכבות שמניעות Mutual Match",
        pillars: [
          {
            title: "Semantic Understanding",
            body: "הפיכת נתונים לא מובנים לאותות.",
          },
          {
            title: "Profile Enrichment",
            body: "תמונה עשירה של אנשים וחברות.",
          },
          {
            title: "Compatibility Modeling",
            body: "התאמה רב־ממדית עם Trade-offs.",
          },
          {
            title: "AI Matching",
            body: "מציאת ה־Fit ההדדי הטוב ביותר.",
          },
          {
            title: "Feedback Loops",
            body: "למידה מתוצאות אמיתיות בשטח.",
          },
        ],
        visual: "pillars",
      },
      {
        id: "s4",
        durationMs: 6500,
        eyebrow: "Product moment",
        title: "לא רק ציון — הסבר",
        body: "Role Fit · Human Fit · Motivation Fit · Culture Fit — עם Why Match / Why Not, פערים, וביטחון בהתאמה.",
        stats: [
          { value: "92%", label: "דוגמת Mutual Match" },
          { value: "Why", label: "הסבר ברור לכל צד" },
          { value: "Gaps", label: "פערים לבדיקת גמישות" },
          { value: "Seconds", label: "רקע עשיר בסריקה קצרה" },
        ],
        visual: "match-gauge",
      },
      {
        id: "s5",
        durationMs: 6000,
        eyebrow: "Recruiter workflow",
        title: "מתחילים מנקודה חכמה יותר",
        bullets: [
          "זמינות, חיפוש דיסקרטי/לא, המלצות ממעסיקים וקולגות — כבר בפרופיל.",
          "שיחה ראשונה איכותית במקום שאלות גנריות.",
          "Talent Exchange — דחייה מתפקיד אחד לא חייבת לסיים את הקשר.",
        ],
        visual: "bullets",
      },
      {
        id: "s6",
        durationMs: 5000,
        eyebrow: "Category",
        title: "Mutual Match — לא עוד Job Board",
        highlight: "Build the intelligence layer between people and work",
        visual: "closing",
      },
    ],
  },
  {
    id: "why-now",
    order: 4,
    labelHe: "למה עכשיו",
    labelEn: "Why Now",
    tagline: "AI, שוק עבודה, ולחץ על כל Hire",
    accent: "blue",
    durationLabel: "50 שנ׳",
    preview: "/investors/6d2f57ea-51a8-4de9-b99d-7efb80a65403.jpg",
    scenes: [
      {
        id: "w1",
        durationMs: 5000,
        eyebrow: "04 · Why Now",
        title: "השוק בשל לשכבת Fit",
        body: "כוחות מאקרו נפגשים עכשיו — והפתרון הישן כבר לא מחזיק.",
        visual: "title",
      },
      {
        id: "w2",
        durationMs: 7000,
        eyebrow: "Macro tailwinds",
        title: "למה החלון פתוח",
        bullets: [
          "AI נכנס לגיוס — אבל רוב הכלים עדיין עושים Screening מהיר, לא Mutual Fit.",
          "עודף מועמדים חזקים בשוק → רעש גבוה יותר למגייסות.",
          "Headcount מצומצם → כל Hire חייב להיות Precision Hire.",
          "מועמדים דורשים שקיפות והתאמה — לא רק תהליך ארוך.",
        ],
        visual: "bullets",
      },
      {
        id: "w3",
        durationMs: 6000,
        eyebrow: "Timing",
        title: "מה השתנה בפועל",
        chips: [
          "GenAI readiness",
          "Skills-based hiring",
          "Explainable AI pressure",
          "Cost-per-hire scrutiny",
          "Retention as strategy",
        ],
        visual: "chips",
      },
      {
        id: "w4",
        durationMs: 6500,
        eyebrow: "Israel lens",
        title: "הקשר מקומי מחזק את הצורך",
        bullets: [
          "מילואים וגלים בשוק ההייטק שינו זמינות ונתיבי קריירה.",
          "סטארטאפים וחברות growth מגייסים lean — בלי מקום ל־mis-hire.",
          "מגייסות עובדות עם יותר פניות ופחות תקנים — צריכות סיגנל חזק יותר.",
        ],
        visual: "bullets",
      },
      {
        id: "w5",
        durationMs: 5500,
        eyebrow: "Window",
        title: "מי שבונה את שכבת ההתאמה עכשיו — מגדיר את הקטגוריה",
        highlight: "Category creation moment",
        body: "Talent Intelligence קיימת. Mutual Match — עדיין underserved.",
        visual: "closing",
      },
    ],
  },
  {
    id: "market",
    order: 5,
    labelHe: "השוק",
    labelEn: "Market",
    tagline: "TAM · SAM · SOM — פוטנציאל הצמיחה",
    accent: "purple",
    durationLabel: "50 שנ׳",
    preview: "/investors/72e6aed5-01f3-4f92-898a-effdc5fafcbd.jpg",
    scenes: [
      {
        id: "m1",
        durationMs: 5000,
        eyebrow: "05 · Market Opportunity",
        title: "שוק גדול. קטגוריה שחסרה.",
        body: "HR Tech רחב — אבל החלל של Mutual Fit עדיין פתוח.",
        visual: "title",
      },
      {
        id: "m2",
        durationMs: 7000,
        eyebrow: "TAM / SAM / SOM",
        title: "מבנה ההזדמנות",
        stats: [
          {
            value: "~$42B",
            label: "TAM · HR Technology (2025)",
          },
          {
            value: "~$11B",
            label: "SAM · Talent Acquisition Software (2026)",
          },
          {
            value: "~$3.2B",
            label: "AI Talent Acquisition Software (2025)",
          },
          {
            value: "Beachhead",
            label: "SOM · IL + EU mid-market hiring teams",
          },
        ],
        visual: "stats",
      },
      {
        id: "m3",
        durationMs: 6000,
        eyebrow: "Growth vectors",
        title: "מה מניע את השוק",
        bullets: [
          "מעבר מ־ATS טרנזקציוני ל־Talent Orchestration.",
          "AI Matching ו־Explainability כדרישת ליבה — לא Nice-to-have.",
          "Skills-based hiring + צורך ב־Quality of Hire מדיד.",
        ],
        visual: "bullets",
      },
      {
        id: "m4",
        durationMs: 6500,
        eyebrow: "Wedge",
        title: "איפה mingle נכנסת",
        left: {
          title: "Beachhead",
          items: [
            "צוותי גיוס ב־Startups / Scaleups",
            "1–25 משרות פעילות",
            "ישראל → אירופה כהרחבה טבעית",
          ],
        },
        right: {
          title: "Expand",
          items: [
            "Enterprise + Internal Mobility",
            "Talent Rediscovery",
            "Intelligence layer across the employee lifecycle",
          ],
        },
        visual: "two-sides",
      },
      {
        id: "m5",
        durationMs: 5500,
        eyebrow: "Thesis",
        title: "השוק משלם על volume. אנחנו בונים על fit.",
        highlight: "Underserved structural gap",
        body: "מי שיכבוש את שכבת ה־Mutual Match — יושב בין האדם לעבודה.",
        visual: "closing",
      },
    ],
  },
  {
    id: "competition",
    order: 6,
    labelHe: "מתחרים",
    labelEn: "Competition",
    tagline: "מי בזירה — ולמה mingle",
    accent: "pink",
    durationLabel: "50 שנ׳",
    preview: "/investors/72e6aed5-01f3-4f92-898a-effdc5fafcbd.jpg",
    scenes: [
      {
        id: "c1",
        durationMs: 5000,
        eyebrow: "06 · Competitive Landscape",
        title: "Beyond Features: Who Are We Up Against?",
        body: "מיפינו את הקטגוריה — וזיהינו איפה השוק עדיין underserved מבנית.",
        visual: "title",
      },
      {
        id: "c2",
        durationMs: 8000,
        eyebrow: "Key gaps",
        title: "מה חסר אצל כולם",
        rows: [
          {
            name: "LinkedIn / Indeed",
            category: "Job Network",
            gap: "Volume ≠ deep person–company fit",
          },
          {
            name: "Greenhouse / Workable",
            category: "ATS",
            gap: "Process tooling, not mutual intelligence",
          },
          {
            name: "Eightfold / SeekOut / Findem",
            category: "Talent Intelligence",
            gap: "Strong on sourcing; weaker on two-sided lived fit",
          },
          {
            name: "mingle",
            category: "Mutual Match",
            gap: "Person ↔ Company across skills, goals, values, culture",
            highlight: true,
          },
        ],
        visual: "competitors",
      },
      {
        id: "c3",
        durationMs: 6500,
        eyebrow: "Why mingle wins",
        title: "לא עוד פיצ׳ר — קטגוריה",
        bullets: [
          "Two-sided profiles — לא רק מועמד מול JD.",
          "Explainable match — Why / Why Not + Gaps.",
          "Recruiter workflow שמתחיל אחרי שיש Fit signal.",
          "Talent Exchange — שמירת קשר אחרי דחייה.",
        ],
        visual: "bullets",
      },
      {
        id: "c4",
        durationMs: 5500,
        eyebrow: "Moat direction",
        title: "Data flywheel + domain intuition",
        body: "כל Match → Interaction → Hire → Performance → Retention מחזק את המודל. היתרון הוא גם לדעת מה למדוד.",
        chips: ["Outcome loops", "Domain edge", "Product taste", "Trust"],
        visual: "chips",
      },
      {
        id: "c5",
        durationMs: 5000,
        eyebrow: "Positioning",
        title: "The market lacks a solution for true mutual fit.",
        highlight: "That’s the opening.",
        visual: "closing",
      },
    ],
  },
  {
    id: "business",
    order: 7,
    labelHe: "מודל עסקי",
    labelEn: "Business Model",
    tagline: "SaaS לפי Active Jobs + ROI ברור",
    accent: "blue",
    durationLabel: "50 שנ׳",
    preview: "/investors/6d2f57ea-51a8-4de9-b99d-7efb80a65403.jpg",
    scenes: [
      {
        id: "b1",
        durationMs: 4500,
        eyebrow: "07 · Business Model",
        title: "תמחור שמדבר בשפת גיוס",
        body: "מנוי חודשי / שנתי לפי מספר משרות פעילות — עם Benchmark מול עלויות גיוס קיימות.",
        visual: "title",
      },
      {
        id: "b2",
        durationMs: 12000,
        eyebrow: "Pricing",
        title: "Plans",
        plans: [
          {
            name: "Core",
            jobs: "1–3 Active Jobs",
            price: "₪2,990",
            yearly: "₪32,292",
            committed: "₪2,691 / חודש בהתחייבות שנתית",
            includes:
              "AI Matching, Role / Human / Motivation Fit, Why Match / Why Not, Match Confidence, Pipeline, Hiring Team, Calendar, Feedback + Company Profile",
            benchmark: "Benchmark גיוס: ₪5K–₪7K / חודש · ₪60K–₪84K / שנה",
          },
          {
            name: "Plus",
            jobs: "4–10 Active Jobs",
            price: "₪4,990",
            yearly: "₪53,892",
            committed: "₪4,491 / חודש בהתחייבות שנתית",
            includes:
              "הכל ב־Core + Candidate Comparison, Talent Pool, Recruitment Analytics, Automations + יותר משתמשים",
            benchmark:
              "Benchmark גיוס: ₪12K–₪18K / חודש · ₪144K–₪216K / שנה",
          },
          {
            name: "Max",
            jobs: "11–25 Active Jobs",
            price: "₪7,990",
            yearly: "₪86,292",
            committed: "₪7,191 / חודש בהתחייבות שנתית",
            includes:
              "הכל ב־Plus + AI Interview Intelligence, AI Copilot, Talent Rediscovery, Company Insights, Advanced Analytics + Internal Mobility",
            benchmark:
              "Benchmark גיוס: ₪30K–₪50K+ / חודש · ₪360K–₪600K+ / שנה",
          },
          {
            name: "Enterprise",
            jobs: "25+ Active Jobs",
            price: "Custom",
            yearly: "Custom",
            committed: "Custom",
            includes:
              "Custom solution + advanced requirements & enterprise support",
            benchmark: "Benchmark: לפי היקף וצרכים",
          },
        ],
        visual: "pricing",
      },
      {
        id: "b3",
        durationMs: 6000,
        eyebrow: "Unit economics logic",
        title: "ROI שנראה מיד בשיחת מכירה",
        bullets: [
          "החלפת חלק מעלויות סינון, מיון וראיונות מיותרים.",
          "שיפור Quality of Hire → פחות mis-hire ופחות churn מוקדם.",
          "Land with Core/Plus → Expand ל־Max/Enterprise כשגדלים.",
        ],
        visual: "bullets",
      },
      {
        id: "b4",
        durationMs: 5500,
        eyebrow: "Motion",
        title: "GTM: Land & Expand",
        chips: [
          "PLG + Sales-assist",
          "Recruiter champion",
          "Annual commit discount",
          "Expansion via jobs & seats",
        ],
        visual: "chips",
      },
      {
        id: "b5",
        durationMs: 4500,
        eyebrow: "Model",
        title: "SaaS predictable. Value tied to open roles.",
        highlight: "Clear buyer · Clear budget · Clear ROI",
        visual: "closing",
      },
    ],
  },
  {
    id: "validation",
    order: 8,
    labelHe: "ולידציה",
    labelEn: "Validation",
    tagline: "ראיות מהשטח — לא רק סлайדים",
    accent: "magenta",
    durationLabel: "50 שנ׳",
    preview: "/investors/222092bb-1b46-49eb-9494-4a2c8341c4ff.jpg",
    scenes: [
      {
        id: "v1",
        durationMs: 5000,
        eyebrow: "08 · Traction & Validation",
        title: "MVP validated with early users",
        body: "בנינו, בדקנו, ודייקנו מול מגייסות, HR ומנהלים שחיים את התהליך.",
        visual: "title",
      },
      {
        id: "v2",
        durationMs: 6500,
        eyebrow: "Learning loops",
        title: "מה כבר נלמד",
        stats: [
          { value: "100+", label: "ראיונות Discovery" },
          { value: "10+", label: "חברות שנחשפו לבעיה" },
          { value: "1,000+", label: "החלטות גיוס שנצפו" },
          { value: "Live", label: "מוצר בפיתוח פעיל + Pilot path" },
        ],
        visual: "stats",
      },
      {
        id: "v3",
        durationMs: 7000,
        eyebrow: "Voice of customer",
        title: "הכאב חוזר על עצמו",
        bullets: [
          "\"אנחנו טובעים ב־CVs בלי לדעת מי באמת Fit לצוות.\"",
          "\"הראיון הראשון מתחיל מאפס — אין קונטקסט אמיתי.\"",
          "\"דחינו מישהו טוב לתפקיד — ואבדנו אותו לגמרי.\"",
          "\"חסרה שקיפות למועמדים — והם מרגישים את זה.\"",
        ],
        visual: "bullets",
      },
      {
        id: "v4",
        durationMs: 6000,
        eyebrow: "Product proof",
        title: "מה כבר קיים במוצר",
        chips: [
          "Two-sided profiles",
          "Mutual matching",
          "Why Match insights",
          "Pipeline & conversations",
          "Company + talent workflows",
        ],
        visual: "chips",
      },
      {
        id: "v5",
        durationMs: 5500,
        eyebrow: "Next proof points",
        title: "מה נמדוד ב־Pilot",
        bullets: [
          "Time-to-first-quality-conversation",
          "Recruiter hours saved on screening",
          "Match → Interview conversion",
          "Candidate experience / NPS",
        ],
        visual: "bullets",
      },
      {
        id: "v6",
        durationMs: 4500,
        eyebrow: "Status",
        title: "Problem confirmed. Wedge clear. Building the moat.",
        highlight: "Ready for capital to accelerate GTM",
        visual: "closing",
      },
    ],
  },
  {
    id: "roadmap",
    order: 9,
    labelHe: "לאן הלאה",
    labelEn: "Roadmap",
    tagline: "מבית גיוס — לבית אחד של People Intelligence",
    accent: "purple",
    durationLabel: "50 שנ׳",
    preview: "/investors/87cf62ed-43b6-4029-aa40-633737f2f8b9.jpg",
    scenes: [
      {
        id: "r1",
        durationMs: 5000,
        eyebrow: "09 · Product Roadmap",
        title: "הכל הופך לבית אחד עבור החברות",
        body: "מתחילים ב־Mutual Match לגיוס — ומתרחבים לשכבת אינטליגנציה לאורך מחזור חיי העובד.",
        visual: "title",
      },
      {
        id: "r2",
        durationMs: 7000,
        eyebrow: "Now → Next",
        title: "אבולוציית המוצר",
        milestones: [
          {
            when: "Now",
            what: "Mutual Matching · Why Match · Pipeline · Conversations · Company/Talent profiles",
          },
          {
            when: "Near",
            what: "Interview Intelligence · Copilot · Talent Rediscovery · Advanced Analytics",
          },
          {
            when: "Next",
            what: "Internal Mobility · Company Insights · Automations עמוקות",
          },
          {
            when: "Then",
            what: "Employee lifecycle layer · Continuity after hire · Mobile for both sides",
          },
        ],
        visual: "timeline",
      },
      {
        id: "r3",
        durationMs: 6500,
        eyebrow: "One roof",
        title: "למה זה חשוב לחברות",
        bullets: [
          "היום: כלי גיוס מפוזרים + אינטואיציה + אקסלים.",
          "עם mingle: התאמה, שיחה, תובנות ו־rediscovery תחת מערכת אחת.",
          "בעתיד: אותו DNA של Fit מלווה גם Internal moves ושימור.",
        ],
        visual: "bullets",
      },
      {
        id: "r4",
        durationMs: 6000,
        eyebrow: "Platform vision",
        title: "Intelligence layer between people and work",
        pillars: [
          {
            title: "Hire",
            body: "Mutual match מדויק יותר, שיחות טובות יותר.",
          },
          {
            title: "Grow",
            body: "Internal mobility על בסיס אותם אותות Fit.",
          },
          {
            title: "Retain",
            body: "הבנה מתמשכת של התאמה — לא רק יום הגיוס.",
          },
        ],
        visual: "pillars",
      },
      {
        id: "r5",
        durationMs: 5000,
        eyebrow: "Direction",
        title: "מ־Recruiting tool ל־Operating system של התאמה",
        highlight: "One home for people decisions",
        visual: "closing",
      },
    ],
  },
  {
    id: "ask",
    order: 10,
    labelHe: "ההשקעה",
    labelEn: "The Ask",
    tagline: "הון, שימוש בכסף, ואבני דרך",
    accent: "pink",
    durationLabel: "50 שנ׳",
    preview: "/investors/be834461-28e2-4a80-9fc2-69d4ed32f940.jpg",
    scenes: [
      {
        id: "a1",
        durationMs: 5000,
        eyebrow: "10 · The Ask",
        title: "Seed round להאצת GTM + Product",
        body: "מגייסים הון כדי להפוך Traction מוקדם למנוע צמיחה מדיד ב־18–24 חודשים.",
        visual: "title",
      },
      {
        id: "a2",
        durationMs: 6500,
        eyebrow: "Raise",
        title: "₪3,000,000",
        highlight: "Seed · ~18–24 months runway",
        body: "סכום שמאפשר לבנות צוות ליבה, לסגור Pilots משלמים, ולהגיע ל־Repeatable sales motion.",
        visual: "quote",
      },
      {
        id: "a3",
        durationMs: 7000,
        eyebrow: "Use of funds",
        title: "לאן הולך הכסף",
        left: {
          title: "Product & AI",
          items: [
            "~40% · Matching quality, explainability, Interview Intelligence",
            "Data loops ו־evaluation",
            "Reliability + security ליסוד Enterprise",
          ],
        },
        right: {
          title: "GTM & Ops",
          items: [
            "~35% · Sales-assist, pilots, partnerships",
            "~15% · Brand & candidate/company acquisition",
            "~10% · Runway buffer / ops",
          ],
        },
        visual: "ask-split",
      },
      {
        id: "a4",
        durationMs: 7000,
        eyebrow: "Milestones · 18–24 months",
        title: "אבני דרך",
        milestones: [
          {
            when: "0–6 חודשים",
            what: "סגירת Pilots משלמים · שיפור Match quality · Playbook מכירה",
          },
          {
            when: "6–12 חודשים",
            what: "NRR חיובי ב־cohort ראשון · Plus/Max expansion · Case studies",
          },
          {
            when: "12–18 חודשים",
            what: "Repeatable pipeline · Hiring team growth · EU beachhead tests",
          },
          {
            when: "18–24 חודשים",
            what: "Series A readiness · Platform narrative (Hire→Grow→Retain)",
          },
        ],
        visual: "timeline",
      },
      {
        id: "a5",
        durationMs: 5500,
        eyebrow: "What you fund",
        title: "הטכנולוגיה ניתנת לבנייה.",
        highlight: "היתרון הוא לדעת מה לבנות — ויש גישה ישירה לבעיה.",
        body: "Ideas are what shape the world.",
        visual: "closing",
      },
    ],
  },
];

export function getFolder(id: PitchFolderId): PitchFolder | undefined {
  return PITCH_FOLDERS.find((f) => f.id === id);
}

export function folderDurationMs(folder: PitchFolder): number {
  return folder.scenes.reduce((sum, s) => sum + s.durationMs, 0);
}
