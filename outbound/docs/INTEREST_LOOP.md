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

## פוש
פוש בדפדפן **לא** נשלח אוטומטית רק בגלל לחיצה.  
רק אם האדם:
1. נרשם ל־mingle  
2. אישר התראות ב־Settings  

אז אפשר לחבר לפי אימייל בעתיד. עד אז — Follow-up Message במייל/לינקדאין.

## אבטחה
- הטוקן חתום ב־HMAC (180 יום)
- טבלת האירועים: service role בלבד (RLS בלי policies ל־anon)
- API mint/list דורש `Authorization: Bearer $OUTBOUND_LINK_SECRET`
