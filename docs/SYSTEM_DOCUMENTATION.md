# mingle — תיעוד טכני של המערכת

מסמך זה נכתב עבור סוכן קוד או מפתח/ת שמצטרפים לפרויקט. הוא משקף את מצב הקוד נכון
ל-2026-09-01: Phases 1–8 מאושרים, ואחריהם פולוש פיילוט (toasts, מצבי ריק, Terms/Privacy,
Board לחברה, Sentry/PostHog, תיקוני מובייל, smoke test ב-Playwright).

מקורות אמת נוספים: `../PRODUCT_SPEC.md` ו-`../BRIDGE.md` (תיקייה אחת מעל שורש `mingle/`) —
המפרט המוצרי המקורי. מסמך זה מתאר את המימוש בפועל.

---

## 1. מה המוצר

**mingle** היא פלטפורמת קשרים תעסוקתיים (career relationship platform) — לא לוח משרות
ולא אפליקציית סווייפ. הרעיון: ליווי מלא של קשר בין talent לחברה, מרגע ההתאמה ועד כ-90 יום
אחרי, על בסיס התאמה אמיתית (ערכים, סגנון עבודה, יעדי קריירה).

שני הצדדים מקבלים עומק שווה: פרופיל, גילוי, מנוע התאמה שקוף, ומסלול קשר מלא.

**תרחישי שימוש מרכזיים:**
1. **הרשמה ו-Onboarding** — אימייל/סיסמה (Supabase Auth), מסלול נפרד ל-talent ול-company.
   כפתור Google הוסר מה-UI (OAuth לא הוגדר). עמודי Terms ו-Privacy מקושרים מההרשמה ומה-welcome.
2. **בניית פרופיל** — talent: פרטים בסיסיים → שאלות עומק → Beyond the CV → מד השלמה → תצוגה
   מקדימה. company: מקביל בעומק, כולל תצוגה מקדימה.
3. **Discovery** — כרטיסים עם פירוק גורמי התאמה, סווייפ במובייל בלבד. סינון שרת לפי
   תעשייה, מיקום וסגנון עבודה, ואז מנוע ההתאמה על הסט המצומצם (12 לכרטיס עמוד).
4. **שמירה וחיבור** — שמירת פרופילים, שליחת/קבלת בקשות. toasts על פעולות ליבה.
5. **רגע ה-MINGLE** — כשמתקיימת התעניינות הדדית. כותרת `It's a mingle` (אות קטנה), סימן M
   גדול בצבעי המותג בראש המסך, קונפטי CSS (burst מה-M ואז נפילה, צבעי מותג בלבד). תצוגה
   מקדימה בפיתוח: `/demo/mingle-moment` (לא בפרודקשן).
6. **צ'אט בזמן אמת** — שיחה לכל חיבור, פאנל הקשר קשר, פעמון התראות (מחושב חי).
7. **מסלול הקשר** — Connected → Exploring → In conversation → Opportunity → Decision →
   Relationship, היסטוריה ב-`relationship_events`.
8. **Board לחברה** — מסך נוסף ב-`/board` (לא מחליף את Pipeline/Connections). עמודות = שלבים,
   כרטיסים = מועמדים מחוברים, גרירה כותבת אירוע דרך `recordBoardStage`. גרירה אחורה מתחת
   לשלב הרחוק ביותר דורשת אישור. talent שפונה ל-`/board` מועבר ל-Connections.

---

## 2. תשתית

- **Supabase:** Postgres + Auth + Realtime. Project ref `yehbilfmzjmdlthhbfgw`.
- **אפליקציה:** Next.js 16 App Router, מקומית `next dev` על `localhost:3000`. אין דיפלוי
  לפרודקשן עדיין. אין הפרדת סביבות, אין CI/CD.
- **ניטור (אופציונלי, חינני בלי מפתח):** Sentry (`NEXT_PUBLIC_SENTRY_DSN`) ו-PostHog
  (`NEXT_PUBLIC_POSTHOG_KEY`, אופציונלי `NEXT_PUBLIC_POSTHOG_HOST`). אתחול ב-
  `instrumentation.ts` / `instrumentation-client.ts`. בלי מפתח: no-op, בלי קריסה.
- **חשבונות בדיקה:** בין היתר `phase4.talent@mingle.test`, `phase4.company@mingle.test`.

---

## 3. Backend ו-DB

אין שכבת Backend נפרדת. Server Components קוראים ל-Supabase. הרשאות ב-RLS.

מיגרציות תחת `supabase/migrations/` (הרצה ידנית ב-SQL Editor; אין service role key בריפו):

| קובץ | מה הוא מוסיף |
|---|---|
| `0001_phase2_auth_onboarding.sql` | `users`, העדפות, trigger בהרשמה |
| `0002_repair_policies_and_trigger.sql` | תיקון policies/trigger |
| `0003_phase3_talent_profile.sql` | `talent_profiles` |
| `0004_phase4_company_profile_and_visibility.sql` | `company_profiles` + קריאה חוצת-צד |
| `0005_saved_profiles.sql` | `saved_profiles` |
| `0006_connections.sql` | `connections` |
| `0007_connections_delete_policy.sql` | policy מחיקה |
| `0008_messaging.sql` | `conversations`, `messages` + Realtime |
| `0009_relationship_events.sql` | `relationship_events` |
| `0010_talent_cv_storage.sql` | bucket פרטי `talent-cvs` + `cv_path` / `cv_file_name` |

אין שכבת קאש, אין תור. Realtime רק להודעות. Google OAuth לא מוגדר ב-Supabase.

---

## 4. פיצ'רים והחלטות הנדסיות

**קיים היום:** theme כהה/בהיר · הרשמה ו-onboarding · אשפי פרופיל · צפייה חוצת-צד ·
Dashboard · מנוע התאמה · Discovery · שמירות · חיבורים · MINGLE · צ'אט · התראות · מסלול
קשר · Board לחברה · toasts · מצבי ריק במסכי ליבה · Terms (`/legal/terms`) ו-Privacy
(`/legal/privacy`) · Sentry/PostHog scaffolding · smoke test Playwright · העלאת CV
אופציונלית לטאלנט (PDF, bucket פרטי).

**החלטות מכוונות:**
- `MATCH_WEIGHTS` ב-`lib/matching/engine.ts` — לא להחזיר לדוגמה שבמפרט.
- התראות מחושבות חיות; שלב הקשר נשמר כאירועים אמיתיים.
- `currentStage` = השלב הרחוק ביותר (`STAGE_RANK`). מסכי Explore/צ'אט/פאנל משתמשים בזה.
- Board משתמש ב-`latestStage` (האירוע האחרון) כדי שצעד אחורה מאושר יהיה גלוי בעמודות.
  `recordBoardStage` עדיין בודק רגרסיה מול `currentStage` ודורש `allowRegression`.
- graceful degradation לכל תלות בטבלה חדשה.
- ניטור/אנליטיקה: אותו דפוס — בלי מפתח אין דיווח ואין קריסה.
- כותרת ה-MINGLE היא טקסט לבן `It's a mingle`. הסימן הגדול (`variant="mark"` size 72)
  נשאר בצבעי המותג.
- **Rate limiting (פיילוט קטן):** ספירה על שורות קיימות בחלון מתגלגל, בלי טבלה חדשה.
  בקשות חיבור חדשות (insert או resend) מוגבלות ל־**20 לשעה למשתמש**. קבלה של בקשה
  ממתינה לא נספרת. הודעות מוגבלות ל־**60 לשעה** ו־**10 לדקה** (burst). חריגה מחזירה
  `RateLimitError` עם ניסוח אנושי ב־UI, לא שגיאת שרת גנרית. אם ספירת המגבלה נכשלת
  (טבלה חסרה / RLS) השליחה ממשיכה — graceful degradation. המספרים גבוהים מספיק לקשר
  אמיתי בפיילוט קטן, ונמוכים מספיק כדי לחסום ספאם אוטומטי לפני פתיחה לגורמים חיצוניים.
- **CV אופציונלי לטאלנט:** bucket פרטי `talent-cvs`, PDF עד 5MB, לא חלק מאחוז ההשלמה.
  בעל הפרופיל מעלה/מוחק; מי שרשאי לקרוא את שורת `talent_profiles` מקבל URL חתום לצפייה.
  בלי המיגרציה: השדה נשאר, ההעלאה מסבירה שאפשר לדלג. לא מרכז החוויה (מסך בסיסי + preview).
- **Discovery סינון שרת:** `industry` / `location` (ilike) ו־`style` (`contains` על
  `work_style` או `work_environment`) ב־PostgREST, pagination של 12. `computeMatch` ו־
  `MATCH_WEIGHTS` לא משתנים; דירוג הציון הוא בתוך העמוד הנוכחי. סווייפ נשאר כמו שהיה.

**מובייל (QA בקוד):** viewport `device-width` + `viewportFit: cover`; `overflow-x: clip`;
קלט 16px מתחת ל-768px; safe-area בהדר ובניווט תחתון; טאבי קשר בגלילה אופקית עם יעד מגע
גדול יותר; גובה צ'אט ב-`dvh` במסכים צרים.

**נותר לפיילוט:** אימות מייל ב-Supabase; דיפלוי; ניקוי/הפרדת סביבות; מפתחות Sentry/PostHog
אמיתיים; QA ידני על production.

---

## 5. תקשורת

אין API חיצוני. קריאות PostgREST דרך supabase-js. Realtime: `postgres_changes` על
`messages`. טיפוסים ב-`lib/supabase/types.ts`, אימות Zod.

---

## 6. שפת קוד

TypeScript בכל הקוד:

- Next.js 16.3.2 (App Router, `proxy.ts` במקום `middleware.ts`)
- React 19.2.8
- Tailwind CSS v4 (`@theme inline`, בלי `tailwind.config`)
- Framer Motion, React Hook Form, Zod
- `@supabase/supabase-js` + `@supabase/ssr`
- `@sentry/nextjs`, `posthog-js`, `posthog-node` (אופציונלי בזמן ריצה)
- `@playwright/test` ל-smoke
- ESLint 9

---

## 7. גבולות גזרה

**לא לגעת בלי סיבה:** theme ב-`globals.css` כולל nested dark בהדר; RLS; `MATCH_WEIGHTS`;
`STAGE_RANK` / `currentStage`; המסקוט לא בשימוש.

**רגיש:**
- `proxy.ts` — `PROTECTED_PREFIXES` ו-`matcher` יחד. מוגן כרגע גם `/board`.
- `sendOrAcceptConnection` — `.or()` על שני כיווני הזוגיות. קצב שליחה ב־`lib/rate-limit.ts`.
- קונפטי MINGLE: CSS burst+fall מכוון. אל תחזירו Framer confetti או צבעי קשת.
- Board: לא מנגנון שלבים מקביל — רק `recordBoardStage` / `recordEvent`.
- Storage `talent-cvs` — פרטי. אל תהפכו לציבורי.

**Routes מוגנים ב-proxy:** `/onboarding`, `/profile`, `/company-profile`, `/dashboard`,
`/discover`, `/connections`, `/conversations`, `/board`.

---

## 8. API חיצוני

אין. PostgREST של Supabase רק לסקריפטים ידניים, עם אותן RLS.

---

## 9. הרצה

```bash
cd mingle
npm install
# .env.local: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
# אופציונלי: NEXT_PUBLIC_SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
# מיגרציות 0001–0010 ב-SQL Editor
npm run dev
```

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | שרת פיתוח, פורט 3000 |
| `npm run build` | בילד פרודקשן |
| `npm run start` | הרצת הבילד |
| `npm run lint` | ESLint |
| `npm run test:e2e` | smoke test Playwright (golden path) |

ה-smoke דורש `.env.local` תקין ו-Chromium של Playwright (`npx playwright install chromium`).
הוא נרשם שני משתמשים חדשים ב-Supabase המשותף.

---

## 10. גישה

רק `http://localhost:3000`. סודות ב-`.env.local` (gitignore). אין service role key בריפו.
Placeholders ב-`.env.example`.

אנליטיקה בסיסית (PostHog, אם יש מפתח): `signup`, `sign_in`, `profile_completed`,
`connection_sent`, `mingle_created`, `message_sent`, `relationship_stage`.

---

*עודכן לפי הקוד בפועל, 2026-09-01. לעדכן אחרי שינוי ארכיטקטורה, סכמה, או גבולות גזרה.*
