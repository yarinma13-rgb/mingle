# הנחיית המשך פיתוח — mingle Mobile (Expo / React Native)

הדבק/י את **כל המסמך** (או הפנה/י לקובץ הזה) כהודעה ראשונה ל-Claude / Cursor Agent שממשיך את אפליקציית המובייל.

---

## 1. התפקיד שלך

אתה מפתח/ת שממשיך/ה **אפליקציית mingle Native** תחת `apps/mobile` — **לא** את אתר ה-Next.js בשורש הריפו.

- **מטרה:** אפליקציה נפרדת ל-iOS/Android (Expo), עם אותו Supabase (Auth + Postgres) כמו הווב.
- **עבודה עצמאית:** קרא/י קוד לפני שינוי; התאם/י לדפוסים שכבר קיימים ב-`apps/mobile` וב-`lib/` של הווב כשצריך לוגיקת דאטה.
- **אל תבקש/י אישור** על כל צעד — המשך פיתוח פונקציונלי. **חריג:** פולish UX מה-handoff המאוחד (ראו §6).

**בעלות מוצר:** ירין (Software engineer). עדיף diff קטן ונכון על פני ריפקטור גדול.

---

## 2. מקורות אמת — קרא/י לפי הסדר

| סדר | קובץ | למה |
|-----|------|-----|
| 1 | `apps/mobile/README.md` | הרצה מקומית, מבנה תיקיות |
| 2 | `docs/SYSTEM_DOCUMENTATION.md` | סכמת Supabase, זרימות מוצר בווב |
| 3 | `apps/mobile/src/lib/api.ts` | כל ה-API helpers של המובייל היום |
| 4 | `lib/matching/feedback.ts`, `lib/connections/persistence.ts`, `lib/matching/saved.ts` | לוגיקה מקבילה בווב — העתק/התאם, אל ת reinvent |
| 5 | `docs/handoff-dev-agent-master-ux.md` | **טיוטה — לא ליישם פולish UX בלי אישור מפורש מירין** |

**Next.js בשורש:** `npm run dev` / `npm run build` — רק לווב. המובייל **לא** נכלל ב-typecheck/ESLint של השורש (`tsconfig.json` + `eslint.config.mjs` מחריגים `apps/mobile/**`).

---

## 3. Git, branches, PR

- **ענף עבודה נוכחי (המשך פיתוח):** `cursor/mobile-app-continue-7009`
- **Base ל-PR:** `cursor/react-native-mobile-app-7009` (לא `main` ישירות, אלא אם ירין ביקש)
- **PR פתוח:** [#94](https://github.com/yarinma13-rgb/mingle/pull/94) — CI ירוק (lint, build, e2e, Vercel) אחרי commit `92c3112`
- **Commits אחרונים רלוונטיים:**
  - `42d551a` — Discover/Candidates/Saved/Profile + connections
  - `d9bc22e` — Welcome web: `Link asChild` + gradient עם `pointerEvents: "none"`
  - `6654c63` — profile editors, roles, settings, תיקוני lint
  - `92c3112` — הוצאת mobile מ-root CI

**Branch naming (Cloud Agent):** `cursor/<תיאור>-7009`, push: `git push -u origin <branch>`.

---

## 4. סביבה מקומית

```bash
cd apps/mobile
cp .env.example .env
# EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon JWT from Supabase Dashboard → API Keys>
npm install
npm run start          # Expo dev server
npm run web            # או w בתפריט — בדיקה בדפדפן
npm run typecheck      # tsc --noEmit — חובה לפני push
```

- **`.env` ב-gitignore** — לעולם לא commit.
- **Project ref ידוע:** `yehbilfmzjmdlthhbfgw` (URL: `https://yehbilfmzjmdlthhbfgw.supabase.co`).
- **Anon key:** רק מה-Dashboard של ירין; אם health מחזיר 401, ה-JWT חייב להתאים ל-ref (יש מקרים של OCR שגוי ב-payload — בדוק עם `curl .../auth/v1/health`).

**Bundle ID (שמור):** `careers.mingle.app` — אין עדיין חשבונות App Store / Play; Expo Go / builds פנימיים.

---

## 5. ארכיטקטורה קצרה

```
apps/mobile/
  app/                    # Expo Router (file-based)
    (auth)/               welcome, path, sign-in/up, onboarding
    (talent)/               tabs: dashboard, discover, connections, conversations, more
    (company)/              tabs: dashboard, candidates, pipeline (board), conversations, more
    conversation/[id]/      chat + explore/opportunity/decision (חלק stub)
    profile/, company-profile/, roles/, settings/, saved.tsx, ...
  src/
    lib/api.ts            # Supabase + business helpers
    lib/supabase.ts       # client, isSupabaseConfigured
    providers/            AuthProvider, ThemeProvider
    components/           ui.tsx, AppHeader, MatchActions
    theme/tokens.ts       light/dark + brand (מיושר למותג mingle)
```

**Auth flow:** `app/index.tsx` → Redirect ל-welcome / onboarding / `(talent)|/(company)` dashboard לפי session + `users` row.

**Web navigation:** ב-Welcome השתמש/י ב-`Link href="..." asChild` + `Pressable` — `router.push` בלבד על overlay absolute עלול לשבור קליקים ב-web.

---

## 6. מה **כבר** עובד (Supabase אמיתי)

- **Discover (talent)** / **Candidates (company):** רשימות מ-`company_profiles` / `talent_profiles`; `MatchActions` → `match_feedback` + `saved_profiles` + `sendOrAcceptConnection`
- **Connections (talent):** שמות צד שני, Accept/Decline, מעבר ל-`/conversation/[connectionId]`
- **Conversations (שני הצדדים):** accepted connections עם שמות
- **Saved:** רשימה + Remove
- **Profile view** `/profile/view/[userId]`: talent/company + match actions
- **Profile edit:** `/profile/build`, `/company-profile/build` — upsert לטבלאות פרופיל
- **Roles:** list + create + paste JD + detail
- **Settings:** theme toggle, sign-out, support
- **Onboarding talent:** שומר career goal ל-`talent_profiles` (`saveTalentCareerGoal`) לפני `completeOnboarding`
- **Chat:** `ensureConversation`, `messages` send/fetch; retry ב-EmptyState
- **Board (company pipeline):** stages + שמות מועמדים

---

## 7. מה **עדיין stub / חסר** (עדיפות פיתוח)

### P0 — ליבה פונקציונלית
1. **ציון התאמה אמיתי** — היום `%` מחושב ב-index (`85 - index*7`) — port / reuse מ-`lib/matching/engine.ts` (או API קיים בווב) לכרטיסי Discover/Candidates.
2. **Onboarding company** — שדה company name לא נשמר ל-`company_profiles` (רק `completeOnboarding`); ליישר עם talent.
3. **Conversation tabs** — `explore`, `opportunity`, `decision` — shell בלבד; port תוכן/שאילתות מהווב (`app/conversations/...` + טבלאות relationship).
4. **Realtime messages** — optional: Supabase Realtime על `messages` (הווב עשוי כבר — חפש/י ב-repo).

### P1 — השלמת מסכים
- `interviews.tsx`, `team.tsx`, `legal/terms`, `legal/privacy` — עדיין "Native screen shell"
- **Company onboarding** → seed `company_profiles.company_name`
- **Push notifications** — לא התחיל; רק אחרי זרימות יציבות

### P2 — איכות
- **E2E / smoke למובייל:** Playwright על `localhost:8081` (Welcome → path → sign-up) — כבר הוכח; הוסף signed-in flows עם test user.
- **Expo lint job ב-CI (אופציונלי):** workflow נפרד `cd apps/mobile && npm ci && npm run typecheck`.

---

## 8. מה **לא** לעשות (בלי אישור ירין)

מתוך `docs/handoff-dev-agent-master-ux.md` — **סטטוס טיוטה:**

- אל תיישם/י את 12 הבאגים + 14 שיפורי UX + 7 פולish ויזואלי מה-handoff.
- אל תשנה/י **פלטת צבעים ראשית**, IA חדש, או DNA matching.
- אל תחליט/י Dark/Light ברירת מחדל שונה בין Talent ל-Company — זו החלטת מוצר פתוחה.

**מותר:** פיתוח פונקציונלי, חיבור דאטה, תיקוני באגים, skeleton/loading, copy פשוט באנגלית (המוצר EN-first במובייל היום).

---

## 9. דפוסי קוד — שמור/י עליהם

- **API:** הוסף/י פונקציות ל-`src/lib/api.ts`; אל תפזר/י `supabase.from` בכל מסך.
- **Match actions:** `src/components/MatchActions.tsx` + `expressInterest` / `markNotFit`.
- **Connections:** `sendOrAcceptConnection` — `.or()` על שני כיווני הזוג (כמו `lib/connections/persistence.ts`).
- **טעינה:** `useFocusEffect` + `useCallback` ל-load (לא `useEffect` שקורא load עם setState — ESLint root עלול להתלונן אם תחזיר mobile ל-eslint).
- **תמונות:** `import img from '...png'` + `src/types/images.d.ts` — לא `require()` (eslint `@typescript-eslint/no-require-imports`).
- **Theme:** `useTheme()` + `ThemeProvider`; toggle ב-settings ו-welcome.

---

## 10. בדיקות לפני PR

```bash
cd apps/mobile && npm run typecheck
# Expo web smoke:
npm run start -- --web --port 8081
# Welcome → Get started → Path → Talent → Sign-up (קליקים / Link)
```

**Root (רק אם נגעת בווב):** `npm run lint && npm run build` בשורש.

---

## 11. משימות מוצעות לסprint הבא (בחר/י לפי סדר)

1. Merge / rebase `#94` ל-base branch אחרי review ירין (אם מתבקש).
2. Port match score ל-Discover/Candidates (P0).
3. שמירת company name ב-onboarding-company (P0).
4. מימוש Explore tab אחד end-to-end מול Supabase (P0).
5. החלפת stubs ב-legal (תוכן static מהווב `/legal/*`) (P1).
6. Realtime chat (P1).

---

## 12. פרומпт קצר להדבקה (Claude)

```
אתה ממשיך את mingle Mobile ב-repo yarinma13-rgb/mingle.
ענף: cursor/mobile-app-continue-7009, PR #94, base cursor/react-native-mobile-app-7009.
קרא docs/handoff-mobile-expo-claude.md ו-apps/mobile/src/lib/api.ts.
עבוד רק תחת apps/mobile unless fixing root CI exclude.
אל תיישם docs/handoff-dev-agent-master-ux.md (טיוטה).
המשך: ציון match אמיתי, onboarding company save, conversation Explore tab, והחלפת stubs.
לפני push: cd apps/mobile && npm run typecheck.
```

---

*עודכן לאחר סשן Cloud Agent — אוקטובר 2026.*
