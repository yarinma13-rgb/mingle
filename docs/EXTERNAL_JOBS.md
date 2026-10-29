# External Opportunities — מנוע איסוף ופרסום משרות אוטומטי

מסמך זה מתאר את המימוש בפועל של מנגנון ה־AI Job Aggregation & Auto-Publishing.
קוד: `lib/external-jobs/`. מיגרציה: `supabase/migrations/0053_external_jobs.sql`.

## זרימה

```
Source Discovery → Permission Check → Job Extraction → AI Rewriting →
Validation → Duplicate Check → Auto Publish → Daily Monitoring
```

| שלב | קובץ | מה קורה |
|---|---|---|
| Cron יומי | `app/api/cron/external-jobs/route.ts` | 04:00 UTC (`vercel.json`), מוגן ב־`CRON_SECRET`, `maxDuration=300` |
| תזמור | `lib/external-jobs/pipeline.ts` | `runExternalJobsCrawl` — מקורות שהגיע זמנם, תקציב זמן ותקציב AI לריצה |
| הרשאה | `pipeline.ts` + `validate.ts#sourcePermission` | בלי `terms_reviewed_at` המקור לא נסרק בכלל; robots.txt נבדק לפני כל בקשה |
| גישה לרשת | `lib/external-jobs/http.ts` | `PoliteFetcher`: User-Agent מזהה, robots.txt (RFC 9309) לכל בקשה **כולל כל redirect**, Rate limit לכל host (הגדרת מקור או Crawl-delay), Retry עם backoff ל־5xx/429/רשת, עצירה כשתקציב הזמן של הריצה נגמר. 401/403, CAPTCHA, אתגר בוטים, login או Disallow — עצירה מיידית, בלי ניסיון עקיפה, והמקור מושהה. robots.txt שלא נגיש (רשת/5xx) — לא שולפים כלום, אבל זו תקלה זמנית ולא חסימה |
| חילוץ | `lib/external-jobs/connectors/` | רק ממשקים שנועדו לכך: Greenhouse / Lever / Ashby / Workable / SmartRecruiters (APIs ציבוריים של לוחות משרות), ו־sitemap + schema.org `JobPosting` באתר הקריירה של החברה. **אין scraper כללי ל־HTML** |
| AI | `lib/external-jobs/ai.ts` | Gemini (אותו client כמו `lib/ai/gemini.ts`). קריאה 1: חילוץ שדות + ניסוח מחדש (שפת המקור אם עברית/אנגלית, אחרת אנגלית). קריאה 2: fact-check עצמאי מול המקור. שם החברה והתפקיד נלקחים מהמקור מילה במילה |
| בדיקות | `lib/external-jobs/validate.ts` | 8 בדיקות חובה (למטה) |
| כפילויות | `pipeline.ts#findDuplicate` | fingerprint (חברה+תפקיד+מיקום מנורמלים) מול משרות שפורסמו + מול `roles` פתוחים של חברה רשומה ב־mingle (לחברה הרשומה יש עדיפות). בנוסף unique index חלקי ב־DB על `fingerprint where status='published'` |
| ניטור | `pipeline.ts#handleMissingJob` | משרה שנעלמה מהפיד הרשמי → אימות מול עמוד המשרה: נסגרה → `expired`; לא ניתן לאמת → `paused` (מוסתרת), ואחרי 3 בדיקות רצופות → `expired`. משרה שתוכן המקור שלה השתנה מעובדת מחדש ועוברת שוב את כל הבדיקות |

## בדיקות החובה לפני פרסום

1. `source_permitted` — המקור פעיל, תנאי השימוש נבדקו ותועדו (מי ומתי), robots.txt מתיר.
2. `job_open` — המשרה מופיעה בפיד הפתוח הנוכחי ועמוד ההגשה לא מחזיר 404/410.
3. `apply_link` — https, על הדומיין של החברה או של ה־ATS שלה, והעמוד נטען ומתייחס למשרה.
4. `no_duplicate`.
5. `complete` — כותרת, חברה, תיאור (≥60 תווים), לפחות דרישה אחת, מיקום או מודל עבודה.
6. `faithful` — fact-check של AI ריק + בדיקות דטרמיניסטיות: אין מספרים שלא במקור, אין שכר/הטבות שלא במקור. בלי AI הבדיקה נכשלת.
7. `original_wording` — לכל היותר 20% חלונות של 8 מילים זהים למקור, ורצף מועתק קצר מ־15 מילים.
8. `not_misleading` — אין רמיזה לשותפות עם mingle / הגשה דרך mingle.

תגיות שלא נתמכות בטקסט המקור נמחקות לפני הבדיקות (`supportedTags`).

**כלל פרסום:** הכל עבר + פרסום אוטומטי פעיל (גלובלי ולמקור) → `published`. כפילות בלבד →
`rejected`. משרה סגורה → `expired`. כל כשל אחר → `pending_review` (לא מתפרסם).
אם ≥50% מהמשרות של מקור נכשלו בריצה (מינימום 4) — הפרסום האוטומטי של המקור מושהה
אוטומטית ונשלחת התראה (כלל 10).

## סטטוסים

`discovered` (בתור לעיבוד) · `pending_review` · `published` · `rejected` · `paused` ·
`expired` · `removed` (בקשת הסרה / מקור הוסר).

`paused` מגיע בשני טעמים: המנוע הסתיר כי לא הצליח לאמת (`status_reason` מתחיל ב־
`Unverifiable:`; המנוע מחזיר לפרסום כשהמשרה מאומתת שוב), או אדמין הסתיר (כל סיבה אחרת;
המנוע ממשיך לעקוב אחרי הזמינות אבל לא משנה תוכן או סטטוס עד שאדמין פועל). השהיית מקור
ע"י אדמין מסתירה את המשרות שפורסמו ממנו, והן חוזרות בסריקה הראשונה אחרי חידוש.

## הפרדת נתונים ואבטחה

- טבלאות נפרדות לגמרי מ־`roles` / `role_applications` / pipeline הגיוס. משרה חיצונית לא
  נכנסת ל־Pipeline, ואין סטטוס גיוס למועמד.
- טבלאות המנוע (`external_job_sources`, `_events`, `_snapshots`, `_takedowns`,
  `external_crawl_runs`, `external_jobs_settings`) — RLS בלי policies: service role בלבד.
- `external_jobs` — קריאה ציבורית רק לשורות `published`. טקסט המקור נשמר ב־
  `external_job_snapshots` ולא נחשף למועמדים.
- Apply עובר דרך `/api/external-jobs/[id]/apply` שסופר קליק ומפנה (302) ל־URL הרשמי
  כפי שהוא — שום פרט של המועמד לא מועבר לחברה (כלל 8).
- לוגו: לא מוצג (יש שדות `logo_url`/`logo_permission` לעתיד). שותפות: לא מוצגת
  (`is_official_partner` נשאר false עד הסכם).
- עמודי משרה חיצונית `noindex`.

## חוויית המועמד

- `/jobs` (טאלנט בלבד, בניווט) — משרות של חברות ב־mingle (RPC `list_open_mingle_roles`)
  לצד External Opportunities. חיפוש, סינון (מיקום, מודל עבודה, היקף, קטגוריה, מקור),
  מיון "Best match" לפי `lib/external-jobs/recommend.ts` (חפיפת כישורים עם אותה
  קנוניזציה של מנוע ההתאמה, תפקיד יעד, מודל עבודה, מיקום).
- `/jobs/[id]` — פרטי משרה, תגית External Opportunity, ההבהרה הנדרשת, תאריך עדכון אחרון,
  Save, Apply לאתר החברה, קישור "Request removal".
- `/saved` — סקשן "Saved jobs".

## Admin Dashboard — `/admin/external-jobs`

טאבים: Analytics (בקרות גלובליות, KPI, פרסומים ליום, משרות מובילות, ריצות אחרונות) ·
Sources (הוספה עם אישור תנאי שימוש מתועד, השהיית סריקה / פרסום, הסרה, עריכת rate
limit ותדירות, Crawl now) · Discovered · Published · Pending Review · Rejected · Expired ·
AI Processing Logs · Removal requests. עמוד משרה: טקסט מקור מול הניסוח, תוצאות הבדיקות,
עריכה ידנית (מסומנת `manually_edited`; שינוי במקור אחרי עריכה מחזיר ל־Pending Review),
פרסום ידני — שעדיין לא עוקף קישור הגשה תקין, כפילות או הרשאת מקור.

## בקשות הסרה של חברות

`/job-removal` (ציבורי). אם המייל של המבקש על דומיין החברה (`company_domains` או דומיין
אתר הקריירה; דומיינים של ATS ומייל חינמי לא נחשבים) — נשלח קישור חד־פעמי (Resend)
לעמוד `/job-removal/confirm`. הקישור עצמו לא מוחק כלום (סורקי מייל פותחים קישורים);
ההסרה מתבצעת רק בלחיצה על "Confirm removal" (POST). בקשה למשרה אחת מסירה אותה; בקשה
לכל החברה מסירה את כל המשרות **רק מהמקורות שהדומיין שלהם תואם למייל המאומת** —
לא לפי שם החברה שהוקלד — ומסמנת אותם `removed`. בלי התאמת דומיין — `needs_review` +
התראה לאדמין, ואישור אדמין מסיר רק את המקור שנרשם על הבקשה.

## התראות

`lib/external-jobs/alerts.ts`: Sentry (אם מוגדר) + מייל ל־`ADMIN_EMAILS` (אם יש
`RESEND_API_KEY`) על: שגיאות מקור בריצה, קריסת cron, השהיית פרסום אוטומטית, בקשת הסרה
שצריכה בדיקה.

## הפעלה

1. להריץ את `0053_external_jobs.sql` ב־SQL Editor.
2. env: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `GEMINI_API_KEY`, ואופציונלית
   `RESEND_API_KEY`, `EXTERNAL_JOBS_GEMINI_MODEL`, `EXTERNAL_JOBS_MAX_AI_PER_RUN` (ברירת
   מחדל 30).
3. להוסיף מקור ב־Sources ולסמן את אישור תנאי השימוש — רק אחרי בדיקה אמיתית של התנאים.
4. "Crawl now" או לחכות ל־cron.

בדיקות (רשת ומסד נתונים מדומים):
- `npx --yes tsx lib/external-jobs/external-jobs.smoke.ts`: לוגיקה טהורה ו־HTTP.
- `npx --yes tsx lib/external-jobs/pipeline.smoke.ts`: הריצה המלאה מקצה לקצה (AI לא זמין → חוזר,
  פרסום, ריצה ללא שינויים, משרה שנסגרה, נעילת ריצה).

ביצועים: בכל ריצה הרישום מול מסד הנתונים נעשה בכמה שאילתות מרוכזות, ה־AI מעבד 4 משרות
במקביל (`EXTERNAL_JOBS_AI_CONCURRENCY`), כל קריאת AI מוגבלת ל־45 שניות, וסיכום הריצה נשמר
תוך כדי, כך שגם ריצה שנקטעה מציגה מה הספיקה.

## בדיקה מול מקורות אמיתיים (2026-10-28)

| מקור | תוצאה |
|---|---|
| Greenhouse (gitlab) | ✓ 150 משרות (תקרה), טקסט מלא, קישור הגשה ואימות זמינות עובדים |
| Lever (palantir, spotify) | ✓ אחרי מעבר לבקשה עם `limit` (התשובה המלאה של Palantir ~6MB) |
| Ashby (notion, ramp) | ✓ |
| Workable | לא אומת: השרת החזיר 429 לכתובת של סביבת הפיתוח; המערכת נסוגה כמצופה |
| SmartRecruiters | **לא זמין**: robots.txt שלהם חוסם את ה־API לכל זחלן מלבד LinkedInBot. הוסתר מטופס הוספת המקור ונחסם בשרת |

## כשה־AI לא זמין

משרה שה־AI נכשל בה (מפתח חסר, מודל שהוצא משימוש, תקלה) לא נחשבת כשל תוכן: היא נשארת
ב־Pending Review עם סיבה שמתחילה ב־`AI processing failed:`, ומעובדת שוב אוטומטית בכל ריצה.
אחרי 3 כשלי AI רצופים הריצה מפסיקה לקרוא ל־AI ונשלחת התראה, והמקור **לא** מושהה בגלל זה.
מודל ברירת המחדל: `gemini-3.6-flash` (`gemini-2.0-flash` הושבת ע"י Google ב־2026-06-01);
אפשר לשנות עם `GEMINI_MODEL` או `EXTERNAL_JOBS_GEMINI_MODEL`.

"Crawl now" בדשבורד מפעיל את הריצה ברקע (`after()`, עד 5 דקות) ומחזיר תשובה מיד;
ריצה אחת בלבד בכל רגע נתון.

## מכסות Gemini

כל משרה = 2 קריאות AI. ב־free tier של Gemini המכסה ל־`gemini-3.6-flash` היא 5 בקשות לדקה
(נבדק 2026-10-29), כלומר כ־2 משרות לדקה, ויש גם מכסה יומית. המנוע מכבד את זמן ההמתנה
ש־Google מבקש (עד 40 שניות), ואפשר לרווח קריאות עם `EXTERNAL_JOBS_AI_RPM=5`. לעבודה
שוטפת מומלץ להפעיל חיוב (billing) על המפתח.

## מגבלות ידועות

- הבדיקה המשפטית של תנאי שימוש של כל מקור היא החלטה אנושית; המערכת מתעדת ואוכפת אותה
  אבל לא מחליפה אותה.
- Rate limit הוא בתוך ריצה (תהליך אחד); אין תור מבוזר. ריצה שנקטעת ממשיכה בריצה הבאה
  (`content_hash = 'pending'`).
- Fact-check של LLM אינו הוכחה; הבדיקות הדטרמיניסטיות (מספרים, שכר/הטבות, העתקה, תגיות)
  נועדו לתפוס את המקרים השכיחים.
