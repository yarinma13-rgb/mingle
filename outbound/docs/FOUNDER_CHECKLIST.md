# רשימת משימות מרוכזת — Outbound + לולאת עניין

מסמך זה מפריד במפורש:
- **את** = פעולות שרק את יכולה לעשות (חשבונות, תשלום, Merge, שליחה ידנית)
- **המערכת / הסוכן** = כבר נבנה או רץ אוטומטית אחרי שההגדרות חיות

PR: https://github.com/yarinma13-rgb/mingle/pull/74

---

## א. מה כבר נבנה (לא צריך לבנות שוב)

| # | יכולת | סטטוס |
|---|--------|--------|
| A1 | צינור לידים חינמי (`scraper` → `contact_finder` → `scorer` → `personalize` → CRM) | מוכן בקוד |
| A2 | ICP: HR עד 200 עובדים / Founder בלי HR | מוכן בקוד |
| A3 | הודעה בעברית שאישרת + LinkedIn Note עד 300 תווים | מוכן בקוד |
| A4 | קישור ייחודי `/r/[token]` + לוג לחיצה | מוכן בקוד |
| A5 | מייל Follow-up אוטומטי פעם אחת אחרי קליק (אותה הודעה שלך) | מוכן בקוד |
| A6 | אחרי הרשמה: `Audience=candidate` מול `company_side` | מוכן בקוד |
| A7 | מדריכים: Phantombuster, YAMM, Interest loop | מוכן ב־`outbound/docs/` |

---

## ב. מה את עושה עכשיו (חובה, בסדר הזה)

### שלב 1 — למזג את הקוד
1. היכנסי ל־PR: https://github.com/yarinma13-rgb/mingle/pull/74  
2. לחצי **Merge pull request**  
3. חכי שהדיפלוי ב־Vercel יסתיים (או תעשי Redeploy ידני אחרי שלב 3)

### שלב 2 — Migrations ב־Supabase
1. היכנסי ל־Supabase של הפרויקט  
2. הרצי / ודאי שקיימים:
   - `0033_outbound_interest_events.sql`
   - `0034_outbound_interest_followup_event.sql`  
3. בלי זה — קליקים לא יישמרו

### שלב 3 — משתני סביבה ב־Vercel
הוסיפי/עדכני:

```
OUTBOUND_LINK_SECRET=מחרוזת-סודית-ארוכה-ואקראית
NEXT_PUBLIC_APP_URL=https://הדומיין-החי-שלך
RESEND_API_KEY=המפתח-של-Resend
SUPABASE_SERVICE_ROLE_KEY=המפתח-service-role
OUTBOUND_FOLLOWUP_ON_CLICK=true
```

וגם (אם עדיין חסר בפרודקשן):
```
NEXT_PUBLIC_POSTHOG_KEY=...
OPENAI_API_KEY=...   # אופציונלי לניקוד חכם; יש fallback מקומי
```

שמרי → **Redeploy**.

### שלב 4 — אותו סוד גם אצלך ב־`outbound/.env`
```
DEMO_MODE=false
COPY_LANGUAGE=he
USE_AI_COPY=false
OPENAI_API_KEY=...
HUNTER_API_KEY=...
NEXT_PUBLIC_APP_URL=https://הדומיין-החי-שלך
OUTBOUND_LINK_SECRET=...אותו ערך כמו ב-Vercel...
```

### שלב 5 — הרצת צינור לידים (במחשב)
```bash
cd outbound
source .venv/bin/activate
python run_pipeline.py --live-apis
python mint_interest_links.py
```

תוצרים:
- `data/leads_log.csv`
- `data/yamm_ready.csv`
- עמודת `Interest Link` ללידים מוכנים

### שלב 6 — שליחה
1. העלי את `yamm_ready.csv` ל־Google Sheet (או סנכרני Sheets אם הגדרת)  
2. שלחי עם YAMM / Mail Meteor עד **50 ליום**  
3. בלינקדאין: `LinkedIn Note` ידני (בטוח, בלי בוט)

### שלב 7 — אחרי שיש קליקים
```bash
python sync_interest_clicks.py --api https://הדומיין-החי-שלך
```

תראי ב־CRM:
- `Clicked At`
- `Audience` = `company_side` / `candidate` / `unknown`
- `Status` = `interested` או `audience_talent`

### שלב 8 — לידים ב־`needs_contact`
אלה חברות עם משרה פתוחה בלי איש קשר ציבורי.  
את משלימה (ידנית או Phantombuster) לפי המדריך:
`outbound/docs/PHANTOMBUSTER_PLAYBOOK.md`  
ואז מריצה שוב `scorer` + `personalize` + `mint_interest_links`.

---

## ג. מה רץ לבד אחרי שההגדרות חיות

| אירוע | מה קורה אוטומטית |
|--------|-------------------|
| ליד לוחץ על Interest Link | לוג `click` + הפניה ל־welcome |
| יש אימייל בטוקן + Resend | נשלח **פעם אחת** המייל שלך |
| נכנס ל־welcome עם token | לוג `visit` |
| נרשם כ־Company | `Audience=company_side` |
| נרשם כ־Talent | `Audience=candidate` |
| פוש בדפדפן | רק אם נרשם **ואישר** התראות — לא אוטומטי מקליק |

---

## ד. מה עדיין לא אוטומטי (בכוונה / בהמשך)

| נושא | למה |
|------|-----|
| סריקת LinkedIn מחוברת | אסור / סיכון חסימה |
| מציאת כל ה־HR/Founders בלי מקור ציבורי | דורש Phantombuster או ידני |
| Nurture מלא למועמדים | מסומן ב־CRM; צינור תוכן נפרד — בהמשך אם תרצי |
| Google Sheets sync | דורש service account שאת יוצרת |

---

## ה. בדיקת תקינות מהירה (אחרי דיפלוי)

1. `python mint_interest_links.py` על ליד עם אימייל שלך  
2. פתחי את ה־Interest Link בדפדפן  
3. ודאי שמגיעים ל־welcome  
4. ודאי שנכנס מייל Follow-up (אם Resend מוגדר)  
5. `python sync_interest_clicks.py --api https://...`  
6. ב־CRM: `Clicked At` מלא  

---

## ו. סיכום חד־משמעי

**את עכשיו:** Merge → Migrations → Env ב־Vercel → `.env` מקומי → הרצת pipeline + mint → שליחה ב־YAMM → sync קליקים → השלמת `needs_contact`.

**המערכת:** זיהוי לחיצות, מייל follow-up חד־פעמי, סיווג Talent/Company אחרי הרשמה, סינון ICP, יצירת הודעות.
