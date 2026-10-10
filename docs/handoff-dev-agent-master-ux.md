# Handoff לסוכן הפיתוח (Cursor) — מסמך אב מאוחד, UI/UX Agent

איחוד של 5 מסמכי מקור לרשימת עבודה אחת, ללא כפילויות: שני בנצ'מרקים מול monday.com (עמוד נחיתה + מסך הרשמה) + שלוש סריקות אמיתיות בתוך המוצר, אחרי login, בצד Talent ובצד Company.
דוח מלא עם הסברים ותיוגי מקור לכל פריט: `mingle-ux-master-handoff.html` (Artifact).

**⚠️ סטטוס: טיוטה לאישור. לא לבצע עד אישור מפורש של יערין. שום דבר לא עולה לאוויר בלי אישורה — גם אחרי שהפיתוח מוכן.**

**עקרון מנחה:** לא לגעת בפלטת הצבעים הראשית, לא לבנות IA/מבנה חדש מאפס, לא לשנות את לוגיקת ה-DNA/ההתאמה. חלק גדול מהעבודה הוא **להעתיק קומפוננטות שכבר קיימות וטובות בצד Company אל צד Talent**, לא לעצב מאפס.

מקורות מלאים בתיקייה: `mingle_product_audit.md`, `mingle-talent-app-review.md`, `mingle_ux_cursor_brief.md`, `ux-profile-redesign.html`, `ux-onboarding-audit.html`.

---

## שלב 1 — חובה (12 באגים, לפני כל פוליש עיצובי)

1. **Messaging שבור** — כניסה לשיחה מ-Conversations מציגה "Messaging isn't set up yet. Try again in a moment." בלי retry.
2. **חיפוש גלובלי לא מחובר לדאטה** — "Search candidates or roles" מחזיר "Nothing matches that" גם עבור רשומות קיימות.
3. **חפיפת טקסט/כפתורים בכרטיס Match** — "WHY THIS MATCH/OPPORTUNITY" נחתך מאחורי View profile/Skip/Interested/Not a fit. קומפוננטה משותפת לשני הצדדים (MatchCard) — תיקון אחד פותר את שניהם.
4. **טאבים בתוך שיחה לא אמינים** — Conversation/Explore/Opportunity/Decision: קליק ראשון לפעמים לא טוען תוכן, לפעמים פותח טאב שגוי. שוחזר עצמאית ב-3 מסמכים — race condition בין state לניתוב.
5. **ציון/כמות Match לא עקביים** — אותה חברה: 60% בדשבורד מול "40 — Worth a look" במסכים אחרים. בנפרד: "3 strong matches" מוצג עם 2 כרטיסים בלבד.
6. **שלב מועמד/ת ושעת ראיון סותרים בין מסכים** — Timeline בשיחה לא תואם Pipeline/Board; שעת ראיון שונה ב-3 שעות בין כרטיס השיחה לעמוד Interviews.
7. **מוני דשבורד תקועים על 0** — New connections / Active conversations / Saved companies מציגים 0 למרות דאטה אמיתי בעמודים הייעודיים.
8. **אחוז השלמת פרופיל שגוי** — 83% למרות שדות מלאים (Company); 100% למרות תמונת פרופיל חסרה (Talent).
9. **תוכן פרופיל חברה קטוע** — "What they're building" נחתך באמצע משפט; "Who thrives here" מוצג כפרגמנט גולמי לא דקדוקי.
10. **ניווט נעלם לגמרי בעמודי פרופיל מלא** — My Profile ועמודי פרופיל מלא בלי סרגל צד/עליון, רק back של הדפדפן.
11. **"See plans" מת + חושף שפה פנימית** — מוביל לעמוד שכתוב בו "This page is a placeholder until billing lives in its own project."
12. **דאטת בדיקה דולפת לתוצאות אמיתיות** — מועמד/ת בשם המשתמש עצמו מופיע/ה בהתאמות אמיתיות. לנקות לפני דמו חיצוני.

---

## שלב 2 — שיפורי UX (14 פריטים, בתוך המבנה הקיים)

1. סמנטיקת צבע לפי ערך (אדום/צהוב/ירוק) על כל ציון/progress bar.
2. תג סיכון/סטטוס עם אייקון + טקסט, לא צבע בלבד (נגישות; לשלב יחד עם #1).
3. CTA אמיתי ב-"Suggested next step" בדשבורד Talent — להעתיק מהדפוס הקיים ב-Company.
4. פריסת Grid ב-Discover של Talent — להעתיק מהדפוס הקיים ב-Company.
5. מצבי ריק מכווני-פעולה בכל מקום, בהשראת "Drop a candidate here" מה-Board.
6. איחוד קומפוננטת badge/מצב לא ברור (Connected/Saved, Open/Paused/Closed) לרכיב אחיד.
7. ביטול כפילות פעולה ב-Discover (Skip נפרד למעלה + Interested/Not a fit למטה).
8. איחוד דפוס עריכה בפרופילים (תגיות+Edit בכל מקום, כולל בלוק Gender שחורג).
9. משוב ויזואלי (toast/אנימציה) על Interested/Skip/Not a fit.
10. `dir="auto"` לכל שדה טקסט חופשי שעלול לקבל עברית.
11. תיקון קופי: "keep getting to know yarin" — לוודא שהמשתנה המוזרק הוא איש קשר, לא שם חברה, עם capitalization נכון.
12. Google SSO בהרשמה + תיקון פאנל Company שלא מתעדכן מנוסח Talent.
13. הגדרות שמוצגות כגמורות בלי פונקציונליות (Email alerts, Profile visibility) — לסמן "בקרוב" או להסתיר.
14. מסכי טעינה ריקים 2-3 שניות בלי spinner/skeleton.

---

## שלב 3 — הרחבות ויזואליות (7 פריטים, פרימיום פוליש)

1. שכפול donut chart + progress בגרדיאנט מדשבורד Company לדשבורד Talent.
2. Radial gauge לציון כולל ב-Discover/Candidates, בשני הצדדים.
3. גוני משטח משניים (elevated surface) לכרטיסים, גם ב-dark וגם ב-light.
4. אייקונים ייעודיים לכל קטגוריית מידע בעמודי פרופיל (חברה/מועמד) — ראו הערה למטה.
5. Micro-transitions על הובר/לחיצה + אנימציית גרירה חלקה ב-Board.
6. הבלטת "Paste a job description instead" ב-Roles כדיפרנציאטור AI.
7. Board הוא הנכס העיצובי הכי חזק כרגע — עדיפות השקעה ראשונה אם המשאב מוגבל.

### החלטת מוצר — Theme (אושרה ע״י יערין)
**לא** לשמור פיצול Talent=Dark / Company=Light. ברירת המחדל לכל סוגי המשתמשים היא **Light**. מתג Dark mode נשאר זמין לכולם (Talent ו-Company) כפיצ׳ר אופציונלי.

### עדכון לקונספט הפרופיל הקודם (ux-profile-redesign.html)
המוקאפ הקודם דימיין מבנה טאבים (סקירה/DNA/ניסיון) — לא נכון למבנה האמיתי. הפרופיל האמיתי הוא שרשרת כרטיסים אחידה (About, How we work, What we value, Who thrives here, What we're building...) באותו גוון בדיוק. הכיוון הנכון: לשמר את מבנה השרשרת, ולהוסיף אייקון ייעודי לכל קטגוריה + גוון-רקע מתחלף עדין + fallback state לשדות חלקיים — לא להמיר לטאבים. עמוד Settings כבר מסודר הכי טוב במוצר ואפשר להשתמש בהיגיון הקיבוץ שלו כמודל ייחוס.

---

## לא נכלל בכוונה

**מבנה מדויק נוסף מעבר למה שתועד** — אם יש מסכים/פיצ'רים שלא נסרקו בשלושת המסמכים האמיתיים (Team accounts, Pricing flow בפועל), אין כאן spec עבורם — הם עדיין ב-placeholder מוצהר ולא נבדקו לעומק.
