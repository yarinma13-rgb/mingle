# הנחיית מסירה לסוכן Claude Code — mingle Outbound + Interest Loop

**עבור:** סוכן פיתוח ב־Claude Code  
**מוצר:** mingle.careers  
**בעלים:** ירין  
**תאריך עדכון:** 2026-09-20  
**קוד שמוזג:** PR https://github.com/yarinma13-rgb/mingle/pull/74 (MERGED ל־`main`)

---

## הקשר קצר
נבנה צינור outbound חינמי + לולאת עניין (קישור ייחודי → קליק → מייל follow-up → סיווג Talent/Company אחרי הרשמה).  
המייסדת סיימה: **Merge** + **migrations 0033/0034**.  
המשימות למטה = מה שנשאר כדי שהמערכת תהיה חיה ותפעולית.

---

## כללי עבודה לסוכן
1. עבוד על `main` העדכני (`git pull origin main`).
2. אל תשבור ICP:
   - פרסונה A: HR/People/Talent בחברה **≤200 עובדים**
   - פרסונה B: Founder/CEO **רק בלי** HR/מגייסת
   - **לא** מועמדים באוטריץ׳ B2B
3. הודעת outreach קבועה (עברית) — אל תשנה בלי אישור מפורש:
   > היי {שם}, ראיתי שאתם מגייסים {תפקיד}. יש לנו ב־mingle דרך קצת אחרת לזהות התאמה לתפקיד, מעבר ל־CV ולניסיון המקצועי. חשבתי שהמשרה הזו יכולה להיות אחלה דוגמה לראות את זה בפועל. רוצה לראות?
4. **אל** תבנה סקרייפינג LinkedIn מחובר / בוט שליחה.
5. פוש בדפדפן — רק אחרי הרשמה + opt-in.
6. תעדכן/צור PR קטן וממוקד לכל קבוצת משימות; כלול הוראות founder אם צריך פעולה ידנית.
7. מסמכי עזר קיימים:
   - `outbound/docs/FOUNDER_CHECKLIST.md`
   - `outbound/docs/INTEREST_LOOP.md`
   - `outbound/docs/YAMM_MAIL_METEOR.md`
   - `outbound/docs/PHANTOMBUSTER_PLAYBOOK.md`

---

## א–ת: כל המשימות שנשארו

### א. Vercel — Environment Variables + Redeploy
**בעלים:** Founder (+ סוכן מדריך/בודק)  
**סטטוס:** ממתין לביצוע Founder  

להוסיף/לוודא ב־Vercel → Project → Settings → Environment Variables (Production):

| Key | מקור |
|-----|------|
| `NEXT_PUBLIC_APP_URL` | דומיין החי (למשל `https://mingle-omega.vercel.app`) בלי `/` בסוף |
| `OUTBOUND_LINK_SECRET` | ליצור: `openssl rand -hex 32` — אותו ערך גם ב־`outbound/.env` |
| `RESEND_API_KEY` | https://resend.com → API Keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → **service_role** (לא anon) |
| `OUTBOUND_FOLLOWUP_ON_CLICK` | `true` |
| `NEXT_PUBLIC_SUPABASE_URL` | לוודא שקיים |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | לוודא שקיים |
| `OPENAI_API_KEY` | אופציונלי (יש heuristic fallback) |
| `NEXT_PUBLIC_POSTHOG_KEY` | מומלץ לאנליטיקס |

אחרי שמירה: **Redeploy** ל־Production.

**Acceptance:** משתנים מופיעים ב־Vercel; דיפלוי ירוק.

---

### ב. סנכרון `outbound/.env` מקומי
**בעלים:** Founder  

להעתיק מ־Vercel לאותו מחשב שמריץ את הצינור:

```
DEMO_MODE=false
COPY_LANGUAGE=he
USE_AI_COPY=false
NEXT_PUBLIC_APP_URL=https://<prod-domain>
OUTBOUND_LINK_SECRET=<same-as-vercel>
OPENAI_API_KEY=...
HUNTER_API_KEY=...
OUTBOUND_FOLLOWUP_ON_CLICK=true
```

**Acceptance:** `mint_interest_links.py` יוצר קישורים עם הדומיין החי (לא localhost).

---

### ג. אימות שה־Migrations באמת חיות
**בעלים:** סוכן / Founder  

ב־Supabase SQL Editor להריץ בדיקה:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'outbound_interest_events'
order by ordinal_position;

select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.outbound_interest_events'::regclass
  and contype = 'c';
```

**Acceptance:** הטבלה קיימת; ה־check כולל `followup_sent`.

---

### ד. Smoke test מקצה לקצה ללולאת עניין
**בעלים:** סוכן מנחה + Founder מבצעת  

1. ליד דמה עם **האימייל של המייסדת** ב־`leads_log.csv` (Status=ready)  
2. `python mint_interest_links.py`  
3. לפתוח את `Interest Link` בדפדפן  
4. לוודא redirect ל־`/welcome?...`  
5. לוודא שנכנס מייל follow-up מ־Resend (פעם אחת)  
6. `python sync_interest_clicks.py --api https://<prod-domain>`  
7. לוודא `Clicked At` מלא ב־CRM  

**Acceptance:** click נשמר; follow-up נשלח פעם אחת; sync מעדכן CRM.

**אם נכשל — סוכן יבדוק:**  
`OUTBOUND_LINK_SECRET` תואם, `RESEND_API_KEY`, domain verified ב־Resend, `SUPABASE_SERVICE_ROLE_KEY`, logs של `/r/[token]`.

---

### ה. הרצת צינור לידים חי (ראשון בפרודקשן)
**בעלים:** Founder (סוכן יכול להריץ אם יש גישה לסביבה)

```bash
cd outbound
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run_pipeline.py --live-apis
python mint_interest_links.py
```

**Acceptance:** יש שורות `ready` עם `Interest Link`; `needs_contact` / `dropped` מתועדים.

---

### ו. חיבור Google Sheets CRM (אופציונלי אבל מומלץ)
**בעלים:** Founder + סוכן לקוד אם חסר  

1. Service account JSON → `outbound/credentials/google_service_account.json`  
2. לשתף Sheet עם האימייל של ה־SA (Editor)  
3. `GOOGLE_SHEET_ID` ב־`.env`  
4. `python crm_sync.py --sheets --ready-only`  

**Acceptance:** טאב Outbound מתמלא inkl. Interest Link / Audience.

---

### ז. שליחת גל ראשון (YAMM ≤50/יום)
**בעלים:** Founder בלבד  

1. לייבא `data/yamm_ready.csv` ל־Sheet  
2. YAMM / Mail Meteor  
3. Body = `{{Personalized Message}}`  
4. מקסימום 50/יום  

מדריך: `outbound/docs/YAMM_MAIL_METEOR.md`

---

### ח. השלמת `needs_contact` (אנשי קשר)
**בעלים:** Founder (+ Phantombuster)  
**סוכן:** לא לגרד LinkedIn מחובר; אפשר לשפר `contact_finder` ממקורות ציבוריים בלבד

לפי `outbound/docs/PHANTOMBUSTER_PLAYBOOK.md`:  
למלא Contact Name / Title / LinkedIn URL / Has HR Function → `scorer` → `personalize` → `mint`.

---

### ט. שיפור חילוץ גודל חברה ממקורות ציבוריים
**בעלים:** סוכן  

- לשפר `outbound/contact_finder.py` (patterns, מקורות נוספים חוקיים)  
- לשמור כלל: בלי size מאומת ≤200 → לא `ready`  

**Acceptance:** יותר לידים עם `Company Size`; oversized נפסלים.

---

### י. שיפור חילוץ דומיין אמיתי ממשרות
**בעלים:** סוכן  

היום חלק מהמשרות מגיעות בלי website אמיתי.  
לשפר `scraper.py` / enrichment כדי למצוא דומיין חברה אמיתי (בלי junk boards).

---

### כ. דשבורד Founder לקליקים (קטן)
**בעלים:** סוכן  

UI פנימי פשוט או סקריפט מדווח:
- קליקים אחרונים מ־`outbound_interest_events`  
- followup_sent  
- Audience אחרי signup  

אפשר להתחיל מ־CLI שמדפיס טבלה מ־`GET /api/outbound/interest`.

---

### ל. Nurture למועמדים (`Audience=candidate`) — בהמשך
**בעלים:** סוכן אחרי אישור מסרים מהמייסדת  

כרגע מסומן `audience_talent` ולא ICP.  
לבנות מסלול הודעות נפרד למועמדים (לא אותה הודעת B2B).  
**לא להתחיל בלי טקסט מאושר מהמייסדת.**

---

### מ. חיבור פוש אחרי opt-in ל־interested company users
**בעלים:** סוכן  

אם נרשמו כ־company + אישרו push — לשלוח nudge מוצר (לא ספאם שיווקי אגרסיבי).  
להשתמש ב־`lib/push/*` הקיים + מיפוי אימייל→user_id.

---

### נ. הגנות אנטי־ספאם / כפילויות
**בעלים:** סוכן  

- לא mint מחדש אם כבר נשלח לאותו אימייל השבוע  
- סטטוסים: `sent_1`, `interested`, `audience_talent`  
- לוודא follow-up נשלח פעם אחת בלבד (כבר יש `followup_sent`)

---

### ס. בדיקות אוטומטיות בסיסיות
**בעלים:** סוכן  

להוסיף בדיקות ל:
- חתימת טוקן Python ↔ TS  
- `parse_employee_count` (501-1000 ≠ 1-10)  
- scorer: HR≤200 עובר; Founder+HR נפסל; בלי title/size לא ready  
- follow-up body = התבנית המאושרת (בלי “נכנסת”)

---

### ע. תיעוד Runbook קצר לפרודקשן
**בעלים:** סוכן  

עדכון `outbound/docs/FOUNDER_CHECKLIST.md` אחרי שה־env החי עובד (עם הדומיין האמיתי, בלי placeholders).

---

### פ. ניטור Resend / כשלי שליחה
**בעלים:** סוכן  

לוג ברור כש־follow-up נכשל (domain לא verified / quota).  
אופציה: event `followup_failed` ב־meta.

---

### צ. וידוא CI ירוק על `main` אחרי המיזוג
**בעלים:** סוכן  

לבדוק GitHub Actions + Vercel Production. לתקן שבירות אם יש.

---

### ק. אבטחה — סודות
**בעלים:** סוכן לבדיקה  

- לוודא ש־`.env` / JSON credentials ב־gitignore  
- לא להדפיס `service_role` / secrets בלוגים  
- RLS על `outbound_interest_events` נשאר בלי policies ל־anon

---

### ר. אופציונלי: Make.com / אוטומציה יומית
**בעלים:** Founder + סוכן  

Cron יומי:
1. `run_pipeline.py --live-apis`  
2. `mint_interest_links.py`  
3. `sync_interest_clicks.py`  

בתוך מגבלות free tiers.

---

### ש. אופציונלי: UI במוצר ל־“Open Match Report” אחרי קליק
**בעלים:** סוכן אחרי אישור מוצר  

דף נחיתה עדין ל־company leads שמגיעים מ־interest link (בלי טקסט מטריד של “ראינו שנכנסת”).

---

### ת. Definition of Done כולל
המערכת נחשבת “חיה” כשכל אלה מתקיימים:

1. Env ב־Vercel + Redeploy ✓  
2. Migrations ✓ (בוצע)  
3. Smoke test: קליק → מייל follow-up → sync CRM ✓  
4. יש לפחות גל אחד של לידים `ready` עם Interest Link ✓  
5. YAMM/שליחה ראשונה בוצעה או מוכנה ✓  
6. `needs_contact` מתועד עם תהליך השלמה ✓  
7. אין שליחת פוש בלי opt-in ✓  
8. הודעת outreach נשארת הנוסח המאושר ✓  

---

## סדר עדיפויות מומלץ לסוכן

1. **א + ב + ג + ד** (הפעלה חיה)  
2. **ה + ז** (לידים + שליחה)  
3. **ח + ט + י** (איכות לידים)  
4. **ס + צ + ק** (יציבות)  
5. **כ + מ + ל + ר + ש** (שיפורים)

---

## פקודות עזר מהירות

```bash
cd outbound
source .venv/bin/activate
python run_pipeline.py --live-apis
python mint_interest_links.py
python sync_interest_clicks.py --api https://<PROD_DOMAIN>
python crm_sync.py --yamm
python crm_sync.py --sheets --ready-only
```

---

## מה לא לעשות
- לא לשנות את נוסח ההודעה בעברית בלי אישור  
- לא לבנות LinkedIn automation  
- לא לשלוח פוש בלי opt-in  
- לא לאשר לידים בלי persona + size≤200  
- לא לערבב nurture של מועמדים עם ICP של חברות בלי מסלול נפרד מאושר

---

## הודעת פתיחה מומלצת ל־Claude Code

```text
קרא את outbound/docs/CLAUDE_CODE_HANDOFF.md ואת outbound/docs/FOUNDER_CHECKLIST.md.
PR #74 כבר ממוזג ל-main; migrations 0033/0034 הורצו.
התחל ממשימות א–ד: ודא env/Vercel/Redeploy (תן לי רשימת ערכים לבדוק),
ואז תדריך אותי ב-smoke test של Interest Link מול הדומיין החי.
אל תשנה את נוסח ההודעה בעברית. אל תבנה LinkedIn scraping.
```
