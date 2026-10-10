# Outbound interest loop (unique links → clicks → personalized follow-up)

## מה זה
לולאה שמזהה **מי לחץ** על קישור ייחודי מהאוטריץ׳, ואז מאפשרת תוכן מותאם.

```
מייל / הודעה עם Interest Link
        ↓
   /r/[token]  (לוג click)
        ↓
   /welcome?... (לוג visit)
        ↓
   Status=interested + Follow-up Message
        ↓
   פוש בדפדפן — רק אחרי הרשמה + opt-in
```

## מה נבנה
| חלק | נתיב |
|---|---|
| חתימת טוקן | `lib/outbound-interest/token.ts` |
| לוג אירועים | `lib/outbound-interest/events.ts` + migration `0033` |
| Redirect | `app/r/[token]/route.ts` |
| API mint/list | `app/api/outbound/interest/route.ts` |
| Beacon ב־welcome | `components/analytics/OutboundInterestBeacon.tsx` |
| יצירת קישורים | `outbound/mint_interest_links.py` |
| סנכרון קליקים ל־CRM | `outbound/sync_interest_clicks.py` |

## הגדרות (.env)
ב־`outbound/.env` וב־Vercel:

```
NEXT_PUBLIC_APP_URL=https://your-domain
OUTBOUND_LINK_SECRET=long-random-string
SUPABASE_SERVICE_ROLE_KEY=...   # לשמירת קליקים
CRON_SECRET=...                 # אפשר להשתמש גם בזה אם OUTBOUND_LINK_SECRET חסר
```

הרצי migration:

`supabase/migrations/0033_outbound_interest_events.sql`

## שימוש יומי
```bash
cd outbound
source .venv/bin/activate

# 1) אחרי שיש לידים ready
python mint_interest_links.py

# 2) שליחת Personalized Message (כולל הקישור) ב־YAMM / LinkedIn

# 3) אחר כך — משיכת מי שלחץ
python sync_interest_clicks.py --api https://your-domain
```

אחרי סנכרון:
- `Status=interested`
- `Clicked At` מלא
- `Follow-up Message` = **אותה הודעה שאישרת** (לא "ראיתי שנכנסת")

הקישור הייחודי משמש רק למדידה פנימית — לא לטקסט מטריד.

## Follow-up אוטומטי אחרי קליק
כשיש אימייל בטוקן + `RESEND_API_KEY`:
1. ליד לוחץ על `/r/[token]`
2. נרשם `click`
3. נשלח **פעם אחת** המייל עם ההודעה שאישרת (בלי “ראיתי שנכנסת”)
4. נרשם `followup_sent` כדי לא לשלוח שוב

כיבוי:
```
OUTBOUND_FOLLOWUP_ON_CLICK=false
```

חשוב: ב־`mint_interest_links.py` חייב להיות `Email` מלא בליד, אחרת אין למי לשלוח.

## זיהוי אחרי הרשמה: מייסד/HR מול מועמד
אחרי קליק, אם האדם נרשם ל־mingle:
1. בוחר **Company** → `Audience=company_side` (HR / Founder צד חברה)
2. בוחר **Talent** → `Audience=candidate` (מועמד)

זה נרשם ב־`outbound_interest_events` (event=`signup` + meta.user_type)  
ומסונכרן ל־CRM ע״י:

```bash
python sync_interest_clicks.py --api https://your-domain
```

| Audience | משמעות | Status ב־CRM |
|---|---|---|
| `company_side` | צד חברה (ICP) | `interested` |
| `candidate` | מועמד | `audience_talent` |
| `unknown` | לחץ אבל עדיין לא נרשם / בלי path | נשאר לפי הקליק |

ההודעה לצד חברה נשארת ההודעה שאישרת.  
מועמדים **לא** נחשבים ICP לאוטריץ׳ B2B — מסומנים בנפרד להמשך nurture ייעודי.

## אבטחה
- הטוקן חתום ב־HMAC (180 יום)
- טבלת האירועים: service role בלבד (RLS בלי policies ל־anon)
- API mint/list דורש `Authorization: Bearer $OUTBOUND_LINK_SECRET`
