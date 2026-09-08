# MINGLE — Design & Feature Handoff (2026-09-07)

Source: founder review of the live company-side product (first real company
test account) plus a follow-up feature brainstorm. This doc is written for
whoever picks up implementation next (Cursor or otherwise) — it assumes no
memory of the conversation that produced it. Every item below states current
behavior, desired behavior, and the exact file(s) to touch. Where a decision
was not fully specified by the founder, an assumption is stated explicitly —
flag it back to her rather than silently deciding differently.

Repo root for all paths below: `mingle/` (this file lives at
`mingle/docs/cursor-handoff-2026-09-07.md`).

Read `AGENTS.md` at the repo root first — this Next.js version has
non-standard conventions; check `node_modules/next/dist/docs/` before writing
Next.js–specific code.

**Important — deploy gap found 2026-09-07:** this repo has a real git remote
(`origin` → `https://github.com/yarinma13-rgb/mingle.git`) wired to Vercel
auto-deploy from `main`. Every fix below that was made by editing files
locally will **not** reach the live site until it is committed and pushed.
Do not assume "file was edited" means "founder can see it" — confirm the
commit actually landed on `main` and a Vercel deploy ran before reporting
anything as done to her.

---

## Founder's original request — verbatim (2026-09-07)

Everything below this line, up to the next `---`, is the founder's original
message, unedited, kept in full so nothing is lost or reinterpreted. The
structured, file-mapped breakdown in the rest of this document is an
analysis layer on top of this source, not a replacement for it — if the two
ever seem to disagree, this verbatim text is the ground truth.

> תיקונים:
>
> 1. קודם כל הלוגו במסך הראשי כשנכנסים לאתר הוא לא לוגו בצבעים שלי, אני רוצה
> לשנות את האלמנטים של האיש והחברה למשהו אחר, הצבעים הם:
> * 🩷 Pink — #EA1E63
> * 🟣 Purple — #7B2FF7
> * 🔵 Blue — #3E6BE0
> מבחינת אלמנטים וניראות של לוגו גם. צירפתי לך תמונה מקורית של הלוגו. תגדיל
> אותו קצת הוא ממש קטן. תגדיל את כל הכתב כמובן תשתמש בפונט: Figtree כמו שיש
> באתר monday ושזה יהיה בכל המוצר מבחינת הפונט גם במשתמש של טאלנט וגם של
> חברה.
>
> 2. כשאני מנסה לפתוח פרופיל לחברה הוא לא נותן לי לצרף לוגו הוא כותב שאפשר
> יהיה לעשות את זה אחרי ושאני אעשה SKIP- תשנה את זה לזה שיהיה אפשר.
>
> 3. במסך פתיחה כשיש כותרת "FIND YOUR NEXT OPPROTUNITY" זה לא טוב כי חברות
> לא מחפשות הזדמנות בהכרח. תשנה את המלל למשהו אחר שמתאים לשני המשתמשים.
>
> 4. במסך דשבורד - לשני המשתמשים כמובן תשנה את הצבע של הסרגל הוא מכוער
> תעשה את זה בדיוק ככה: מצרפת לך תמונה מבחינת צבעים. את הצבע של הרקע של
> הדשבורד תשאיר. כמו כן הלוגו של מינגל בכלל לא בצבעים שלו!
>
> בשורה של האלמנטים תשים לב שהכנסת את הצהוב אבל לא הכנסת את הירוק שביקשתי.
> ועכשיו יש ורוד כחול סגול ורוד צהוב למה צריך להיות פעמיים ורוד? או שתשנה
> את זה לצבע אסטרטגי או לירוק. תיקח מהפלטה של Monday מה- F12.
>
> 5. אני צריכה שתעשה את כל הגודל של הכיתוב והמבנה בצורה מותאמת למסך WEB
> לפעמים זה צר מדי לפעמים זה רחב מדי עם חלל חסר. שים לב לצילום מסך ששלחתי
> לך של momday- תראה איך הבר העליון והבר השמאלי מאורגנים מבחינת אלמנטים של
> קטגוריות איך האימוג'ים ניראים איך הכיתוב ניראה בנוסף תראה באיזה צבע הם
> לעומת המסך רקע, בנוסף תראה את הגודל והאינטגרטיביות של הלוגו שלהם בבר
> המשלאי, בנוסף תראה את הגודל של הפונט והיחסיות של הכיתוב בתוך המסך כך
> שמותאם ל-WEB.
>
> 6. במשתמשים של חברות (COMPANIES) אני רוצה שתוסיף אלמנט של ציר התקדמות או
> עיגול של פאי שהוא יהיה מושפע מהנתונים של כמות מועמדים, סטטוס מועמדים כמה
> בראיון כמה בדירוג גבוה, שיהיו אלמנטים של נתונים בדשבורד מעבר לשורה של
> האלמנטים.
>
> 7. ביקשתי שה-SEE PLANS יהיה בצד שמאלי ליד הלוגו של mingle. בדיוק כמו
> בצילום מסך של monday ששלחתי לך.
>
> 8. כשאני גוללת למטה במסך אני רוצה שכל הסרגל ירד איתי.
>
> הצירוף מסך של המסך המלבני הקטן ניראה ממש ממש לא טוב. תשנה את העיצוב,
> תכניס את זה בצורה יותר יפה עם כפתורים אולי או משהו ממוסגר ומסומן לפי
> פלטת צבעים שצירפתי פה בהודעה.
>
> 9. במסך DARK תראה איך זה חתוך זה לא ניראה טוב תתקן את זה
>
> תצמצם קצת את הרווחים בין האלמנטים של הקטגוריות - ממש ביחסיות כמו שיש
> במסך המצורף פה של monday.
>
> 10. ה- PIPELINES של משתמש החברה ניראה מאוד דל, תתן שם עיצוב משמעותי
> שניראה כמו PIPLINE איכותי מסודר שיעזור למגייסות ול-HRיות כדי להבין מה
> קורה במבט.
>
> 11. ה-BOARD אהבתי מאוד את הניראות יחד עם זאת הייתי רוצה שיהיה קצת יותר
> מגניב - תיקח רעיונות מ-monday כי זה קצת כמו OVERVIEW של ניהול משימות.
>
> 12. ב-SETTING, של שני סוגי המשתמשים תכניס עוד הגדרות תעשה את זה כמו
> רשימה שבתוך כל רשימה אפשר לבחור דברים ותתן חלון חיפוש כשנכנסים להגדרות
> כדי שיהיה קל למצוא דברים.
>
> 13. אני רוצה להוסיף פיצ'ר של דירוג מועמדים בפרופיל שלהם של המעסיקים
> שלהם או קולגות על ידי כוכבים ופרופיל לינקדאין אני שולחת לך צילום של
> הדמיה שתבין על מה אני מדברת.
>
> 14. אני רוצה שלמשתמש החברה יהיה אופציה לעשות סינון בחיפוש מועמדים לפי
> מרחק, שנות ניסיון, תפקיד, עם אופציה של האם אנחנו מחפשים מישהו שיעבוד
> בצורה היברידית או לא, איזה ערכים מובילים אנחנו מחפשים בתפקיד. שהכל יהיה
> בצורה נגישה אם זה מד כזה שאפשר לשחק איתו כדי להגביל קילומטרים, שנות
> ניסיון, אופציות לחיפוש של טכנולוגיות או SKILLS בתוך חלון של סינון וחיתוך
> היצעת מועמדים. שיפתח חלון קטן שיהיה אפשר להוסיף פילטרים בצורה נוחה.
> כתבתי פה איזה פילטרים למשל. פילטרים כמו מרחק או ניסיון תתן סטיית תקן של
> שנה וחצי-שנתיים למטה כדי לא לפספס מועמדים טובים כשמגדירים את זה.
>
> 15. אני צריכה שתגביל לכל המשתמשים גם מועמדים וגם חברות כשהם בונים פרופיל
> שהם יכולים לסמן את ה-TOP5 שלהם מבחינת ערכים בכל קטגוריה שבה אפשר לבחור
> ערכים. תגדיל קצת את היצעת הערכים, תכונות, ערכי תרבות. כי בסוף אני רוצה
> שיהיה מאצ' לפי זה ואי אפשר שכולם יסמנו הכל.
>
> 16. תוסיף אופציה במשתמש של החברות ב-ROLES - ליצור משרה, אין פלוס אין ADD
> NEW ROLE משהו שיהיה אפשר לבנות איתו את המשרה. תעשה את זה נוח לא כל דבר
> לכתוב כי זה מעייף ואנחנו מחפשים לתת אפיקטיביות ופתרון חכם.
>
> חשוב לי גם להדגיש בפניך שהמוצר בא לחסוך זמן בחיפוש מועמדים בכללי ולמקד
> את מציאת המועמדים בצורה יותר אפקטיבית ככה שמגייסת ישר תוכל לבחור מהיצע
> המועמדים המתאים ביותר. וגם תהליך הגיוס עצמו במערכת שלי צריכה לחסוך את
> זמן הגיוס שלוקח במעמד ראיונות היום כלומר זה בסדר להיפגש פרונטלית אבל
> אפשר גם בזום אז שיהיה CALENDER נגיש שמתחברת עם CALENDER של גוגל או
> אאוטלוק או של מינגל ויהיה אפשר להוסיף משתמשים מתוך האפליקציה. כלומר בתוך
> כל משתמש של חברה יהיה ניתן לפתוח משתמש של העובד עצמו למשל HRית או TEAM
> LEADER וכדומה ואז ברגע שעושים הזמנה לראיון ביומן זה נכנס גם ליומן של
> מינגל וגם ליומן שאותה חברה משתמשת אם זה גוגל או אאוטלוק.
>
> [Sent as a follow-up message, same session:]
>
> אין לי תמונה של המלצות אבל אני רוצה שכל מועמד יוכל להוסיף אם הוא רוצה
> המלצה וזה ישלח לוואטסאפ או למייל של המעסיק או הקולגה אופציה לכתוב המלצה
> והקולגה או המנהל יהיו צריכים להתחבר עם משתמש הלינקדאין שלהם כדי לכתוב את
> ההמלצה הזו.
>
> אני רוצה שכשחברה פותחת משרה היא תוכל להגדיר ציפיות שכר שלה למשרה כלומר
> כמה היא מוכנה לשלם על המשרה ושזה לא יהיה חשוף למועמדים. וגם כשמועמדים
> פותחים פרופיל יהיה להם אופציה לכתוב את ציפיות השכר שלהם אבל שזה לא יהיה
> חשוף לחברות וככה זה יהיה חלק מהמאצ'. תתכנן חזק יותר את המשין לרנינג איך
> נקבע המאצ'.

Note referenced inline above: the founder attached five images across the
two messages this document is built from — (1) the original logo reference
(pink→blue "M" made of two person-silhouettes), (2) a screenshot of the
current dashboard KPI row (the pink/purple/blue/pink/yellow duplicate-pink
issue), (3) a screenshot of her monday.com workspace (topbar/sidebar/
spacing/"See plans" reference for items 1, 5, 7, 9), (4) the small
rectangular match-card screenshot referenced as looking bad, and (5) the
dark-mode chat screen showing the cut-off issue (item 9/10). None of these
image files have reached the repo — they exist only as inline chat
attachments. Ask the founder to upload them as files if visual reference is
needed during implementation; do not guess their exact pixel content from
description alone.

---

## 0. Already done this session (do not redo)

- `components/dashboard/CompanyDashboard.tsx` — "Active conversations" KPI
  tile changed from `accent="pink"` to `accent="success"` (was a duplicate
  pink alongside "Profile completion"; now the 5-tile row uses pink / purple
  / blue / success(green) / waiting(yellow) with no repeats).
- `components/dashboard/DashboardShell.tsx`:
  - Outer layout changed from `min-h-screen` (whole page scrolls) to
    `h-screen overflow-hidden` with `<main>` as the sole `overflow-y-auto`
    region. Sidebar (`<aside>`) and header now stay pinned while page content
    scrolls underneath.
  - `SeePlansButton` moved out of the header's right-side icon cluster into a
    new left-aligned cluster next to a small desktop `MingleLogo` (size 40),
    rendered before the search bar. Removed from the right cluster entirely.
    Note: this desktop logo+button cluster is `hidden md:flex` — on mobile
    only the existing large logo shows, no `SeePlansButton` (avoids crowding
    the mobile header; the mobile bottom nav is the primary mobile nav).
- `supabase/migrations/0013_company_logo_storage.sql` — created. **Not yet
  run** — the founder needs to run it manually via Supabase Dashboard → SQL
  Editor (same constraint as all prior migrations: only an anon key is
  available, no DDL access). This creates the `logos` storage bucket that
  `components/CompanyProfileWizard.tsx`'s `handleLogoChange` (lines 225-250)
  already expects but which never existed — that's why every logo upload
  silently failed and fell back to the "skip for now" message. Once the
  migration runs, no code change is needed — the upload path already works
  against this bucket name.

**Open question sent to founder, no answer yet as of this doc:** the
"Find your next opportunity" headline complaint. Investigated —
`components/AuthForm.tsx` (`PATH_COPY`, lines 17-26) already shows different
headlines per user type (talent: "Find your next opportunity", company:
"Find your next great hire"). Not a bug as far as could be verified. Likely
she saw the talent card's title ("I'm looking for my next opportunity") on
the shared two-card selection screen (`components/WelcomeScreen.tsx`,
`PATH_CARDS`, lines 12-30) while previewing the company path — both cards
render side by side there. **Do not change this copy** until she confirms
whether she wants it unified into one shared phrase or considers the current
per-audience copy correct as-is.

---

## 1. Branding foundation

### 1.1 Logo redesign — BLOCKED on asset from founder
`components/MingleLogo.tsx` is the single source of truth for the mark,
used in 14 files. It currently paints a JPEG (`public/brand/mingle-mark.jpg`,
no alpha channel) through a runtime canvas "knockout mask" (threshold on
saturation/luminance) so it can be tinted with `--mingle-connection-gradient`.
The in-file comment explicitly says "Never recreate with SVG/text" — that
warning predates this request and was about *not* hand-typing "MINGLE" as a
text fallback; it does not block using a proper new image asset.

The founder wants the person/company glyph elements themselves redesigned
(not just recolored), in this exact palette:
- Pink `#EA1E63`
- Purple `#7B2FF7`
- Blue `#3E6BE0`

She shared a reference image inline in chat (two person-silhouettes forming
an "M", pink-to-blue gradient) but it has not reached the repo as a file yet
— **do not attempt to recreate it from a text description**. Ask her for an
actual file upload (PNG with transparency preferred, high resolution; JPEG
acceptable, we'll re-run the knockout-mask approach on it like today).

Once the asset lands at e.g. `public/brand/mingle-mark-2026.png` with a real
alpha channel:
- Simplify `MingleLogo.tsx`: drop the canvas knockout-mask logic entirely
  (`loadKnockoutMask`, the `useEffect`, `knockoutReady` state) and render the
  image directly (a plain `<Image>` from `next/image`, or a `<span>` with
  `mask-image: url(...)` only if you still want it dynamically re-tintable
  per theme — check whether the new asset already has the gradient baked in,
  in which case no CSS masking/tinting is needed at all, just an `<img>`).
- She also asked to enlarge the logo ("תגדיל אותו קצת הוא ממש קטן" — "make it
  a bit bigger, it's really small"). Current call sites use `size={58}`
  (sidebar, `DashboardShell.tsx` line ~109), `size={40}` (new header cluster
  from item 0 above), `size={56}`/`size={36}`/etc. across wizards/auth
  screens. Bump each by roughly 20-30% once the new asset is in — check
  visually per placement rather than applying one blanket multiplier, since
  some spots (e.g. sidebar rail is only `6.25rem` wide) have a hard ceiling.

### 1.2 Font — already correct, no action needed
Figtree is already the only font in the product (`app/layout.tsx` lines
3/11-16 via `next/font/google`, wired through `app/globals.css` lines 51-52
and 130-131, applied to `<body>` at line 174). The founder asked for Figtree
"like on monday.com" across both talent and company UI — this is already
true site-wide. If any component is found overriding `font-family` locally
(grep the repo for `font-family:` and inline `style` font overrides before
starting other work, just to confirm none exist), fix it, but none were
found during this pass.

She also asked to "increase all the text size" generally — this is vague
without more specifics. **Do not do a blanket font-size bump.** Instead fold
this into item 1.4 below (matching Monday's actual type scale/density) so
sizing changes are grounded in a real reference rather than guesswork.

### 1.3 Color palette enforcement
`app/globals.css` is the single source of truth (Tailwind v4, CSS-first
config, no `tailwind.config.*` file). The three accent tokens she specified
are **already exactly correct** in the codebase:
```css
--mingle-accent-pink: #ea1e63;   /* matches #EA1E63 */
--mingle-accent-purple: #7b2ff7; /* matches #7B2FF7 */
--mingle-accent-blue: #3e6be0;   /* matches #3E6BE0 */
```
So the complaint is not about the token values — it's about (a) the logo not
using them (see 1.1) and (b) the **sidebar background** color
(`--mingle-sidebar-bg: #c5d4e8` light / `#2e384f` dark, `app/globals.css`
lines 30 and 84, applied via `.mingle-app-sidebar` at lines 292-306) which
she called ugly and wants replaced with colors pulled from monday.com's
actual UI, inspected via browser devtools ("F12") rather than guessed.

**Action:** open monday.com in a real browser, inspect the left sidebar
`background-color` (and hover/active states) via computed styles, and port
the real hex values into `--mingle-sidebar-bg` (both light and dark
`[data-theme]` blocks). Do not free-hand a color here — she was explicit
about wanting the actual sampled value. Leave `--mingle-background` /
`--mingle-bg` (the dashboard canvas background) untouched — she explicitly
said to keep that as-is.

**Do not touch** `--mingle-accent-*` — they're already right.

---

## 2. Layout & spacing pass (Monday.com as reference)

The founder sent a screenshot of her monday.com workspace as the density/
layout reference for several items. Cross-cutting guidance, not a single
file:

- **Sidebar/topbar organization**: compare category icon sizing, label
  typography, spacing between nav sections, and the icon-to-background
  contrast ratio in Monday's UI against `components/dashboard/DashboardShell.tsx`
  (desktop `<aside>`, lines ~107-161). Tighten vertical rhythm between nav
  items — currently each item is `py-3` with a `my-3` divider; check against
  Monday's actual spacing rather than assuming the current values are too
  loose (inspect, don't guess).
- **Sticky sidebar** — done, see item 0.
- **"See plans" placement** — done, see item 0.
- **General web-width adaptation**: she flagged some screens as too narrow,
  others with awkward empty space at wide viewports. This needs a per-screen
  pass at common breakpoints (1280px, 1440px, 1920px) rather than a single
  global fix — start with the company dashboard (`components/dashboard/CompanyDashboard.tsx`)
  and the pipeline/board screens (item 4 below) since those are the ones she
  was actively reviewing.

---

## 3. Bug fixes

### 3.1 Dark mode — chat screen appears "cut off"
`components/messaging/ConversationScreen.tsx` line 146 sizes the whole
conversation panel with a magic-number calc:
```
h-[calc(100dvh-14.5rem)] ... md:h-[calc(100vh-9rem)]
```
These offsets were tuned against the *old* page-scrolling `DashboardShell`
layout. As of item 0 above, `DashboardShell` now uses `h-screen
overflow-hidden` with `<main>` as an independent scroll container — verify
this calc still lands correctly against the new shell (it may now be
double-subtracting or under-subtracting chrome height, which would explain
the composer/input row appearing clipped at the bottom in the founder's
screenshot). Reproduce in an actual browser at typical viewport sizes, in
both themes — the founder saw this specifically in dark mode, but the markup
has no `dark:`-specific styling anywhere in the file or the codebase (dark
mode is 100% driven by the `--mingle-*` CSS custom properties re-defined
under `[data-theme="dark"]` in `app/globals.css`), so if it reproduces in
light mode too, the fix is the same regardless of theme. Prefer replacing
the magic-number calc with a flex-based fill (`h-full` inside a properly
height-constrained parent) over tuning more magic numbers.

### 3.2 Match card needs a visual redesign
`components/messaging/RelationshipContextPanel.tsx` — the card showing match
%, "Why you connected", "Worth exploring", and "Timeline" (lines ~66-143).
Founder's words: "looks really, really bad" — wants it "framed nicely, maybe
with buttons, marked with the color palette" she sent. Concretely: give the
card real card framing (border/surface consistent with `--mingle-surface`
and `--mingle-border`), consider a CTA button (e.g. "Suggest next step" or
similar — check `lib/relationship/persistence.ts` for available relationship
actions to wire a real button to, don't add a decorative no-op button), and
use the three accent colors purposefully (e.g. match-% chip in gradient,
stage pill in its semantic color) rather than the current plain text
sections.

---

## 4. Company dashboard & management screens

### 4.1 Dashboard: add a real chart, not just the KPI row
Founder wants a progress ring or pie/donut chart on the company dashboard
driven by real candidate-pipeline data (counts by stage: connected,
exploring, in conversation, high-ranked/opportunity, etc.), beyond the
existing 5-tile KPI row.
- Stage vocabulary already exists: `components/board/CompanyBoardScreen.tsx`
  `BOARD_COLUMNS` (lines 31-38: Connected, Exploring, In conversation,
  Opportunity, Decision, Relationship).
- Data shaping already exists: `lib/dashboard/funnel.ts` and the funnel
  object consumed by `components/dashboard/CompanyPipelineFunnel.tsx` (used
  today for the existing funnel widget, `CompanyDashboard.tsx` line 123).
- **Recommendation:** add a donut/pie chart component next to (not
  replacing) `CompanyPipelineFunnel`, fed by the same `funnel.counts` object
  so there's one source of truth for the numbers. Use the accent palette
  (pink/purple/blue/success/warning) per segment, matching the KPI tile
  colors for the same stage where they overlap conceptually.

### 4.2 Pipeline screen feels sparse
`components/connections/ConnectionsScreen.tsx` (routed at `/connections`,
labeled "Pipeline" in nav — `DashboardShell.tsx` line 43) needs a more
substantial, "pipeline software"-grade layout: clear stage columns/sections,
counts per stage, and enough visual weight that a recruiter/HR user can read
status at a glance. Treat `components/board/CompanyBoardScreen.tsx` (which
she said she already likes) as the design-quality bar to match, not
necessarily the same layout — Pipeline and Board are meant to answer
different questions (Board = drag-and-drop working view; Pipeline = at-a-
glance status/reporting view).

### 4.3 Board: keep current layout, raise the polish ceiling
She likes `components/board/CompanyBoardScreen.tsx` as-is structurally. Pull
concrete polish ideas from monday.com (card shadows/hover states, column
header treatment, count badges, maybe subtle drag-affordance styling) — this
is a "make it feel more premium" pass, not a restructure.

### 4.4 Settings: needs real content + search
`app/settings/page.tsx` is currently an intentional stub (58 lines,
literally says "Notification preferences and workspace options will live
here" at lines 41-43) shared by both user types via `isCompany` branching.
Founder wants, for both talent and company:
- A real settings list (grouped sections — e.g. Account, Notifications,
  Privacy; for company also Team/Workspace, see item 6.4 below for how the
  calendar feature's team-member management likely lives here).
- A search input at the top of the settings page that filters the list of
  settings items/sections as you type.
- Existing sub-components to reuse/extend: `components/settings/ChangePasswordForm.tsx`,
  `components/settings/SignOutButton.tsx`.

---

## 5. Profile-building constraints

### 5.1 Cap multi-select value/trait pickers at 5
Every "pick your values/traits/culture" multi-select step on both talent and
company profile builders currently allows unlimited selections — defeats the
matching purpose ("can't have everyone check everything"). Confirmed no cap
exists today:
- Company side: `components/CompanyProfileWizard.tsx`, `toggleMulti` (lines
  184-194) — unconditionally appends to the array with no length check.
- Talent side: find the equivalent toggle handler in
  `components/OnboardingWizard.tsx` / `components/ProfileWizard.tsx` (not
  yet located in this pass — grep for the multi-select toggle pattern there)
  and apply the same constraint.
- **Fix:** in each toggle handler, block adding a new option once the
  current selection length is 5 (removal always allowed regardless of
  count). Surface this as a soft UI cue too — e.g. disable/grey out unselected
  chips once 5 are picked, with a "5 of 5 selected" hint — not just a
  silent no-op click.

### 5.2 Expand the option lists
Founder wants a bigger pool to choose from (makes the 5-cap meaningful
rather than "pick 5 out of 10"). Current option arrays to extend:
- `lib/company-profile/questions.ts` — `workEnvironment` (10 options),
  `values` (10 options), `lookingFor` (10 options).
- `lib/onboarding/questions.ts` — `TALENT_QUESTIONS` q2 (10 options), q3 (5
  options); `COMPANY_QUESTIONS` (the *onboarding*, not company-profile-wizard,
  set — note there are two differently-shaped `COMPANY_QUESTIONS` exports in
  this codebase, one in each file above; don't conflate them) q2 (9
  options), q3 (9 options).
- No target count was given — roughly double each list (15-20 options) is a
  reasonable default, but check with the founder on the exact culture/values
  vocabulary she wants represented before finalizing copy.

---

## 6. New features (large — plan before building)

These four are substantial enough to warrant their own short design pass
before implementation, not a direct jump to code. Each needs at least one
architecture decision confirmed with the founder first.

### 6.1 Job/Role builder ("Add New Role") — done 2026-09-08
Shipped. `app/roles/page.tsx` lists company-owned roles; `components/roles/RoleBuilder.tsx`
is a 5-step chip-first wizard (title + department, seniority + employment,
work model from `WORK_MODEL_OPTIONS`, skills capped at 5, optional description).
Schema: `supabase/migrations/0014_company_roles.sql` (`public.roles`, owner-only
RLS). `salary_min` / `salary_max` exist on the table for 6.3 and are never
selected or shown in UI. Custom tags: chip lists (role skills, profile
values, onboarding multi-picks, Discover values) have a small text field
plus "+" to add a label that is not on the preset list, still capped at 5
on profile/role picks. **Migration is not run until the founder pastes it
into the Supabase SQL Editor** — the page degrades to an instruction empty
state if the table is missing. Pipeline counts per role are omitted: connections
have no `role_id` yet.

### 6.2 Candidate recommendations (star rating + LinkedIn-verified)
Shipped in app code 2026-09-08. Founder still needs to paste
`supabase/migrations/0016_recommendations.sql` in the SQL Editor, keep
`LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` as **server-only Secrets**
on Vercel (Production + Preview, not `NEXT_PUBLIC_`), and Redeploy after
this code is on `main`.
- Candidate: "Request a recommendation" on `/profile/build` and own talent
  profile. Email goes through Resend (`lib/email/recommendation-request.ts`,
  same FROM / `appOrigin()` / try-catch as connection requests). WhatsApp is
  a `wa.me` deep link in a new tab (no Business API).
- Recommender (often not a mingle user): public `/recommend/[token]`. Sign in
  with LinkedIn OpenID at `/api/auth/linkedin/callback` (the registered
  redirect URI). Product only returns name / email / picture; UI shows name
  plus "מאומת דרך LinkedIn", never a job headline.
- Submit is `submit_recommendation` (security definer). Public listing is
  `list_submitted_recommendations` so `recommender_contact` never leaves
  the table. Identity is bound in an httpOnly cookie, not trusted from the
  browser.
- Display: stars + LinkedIn name + verified line on the public talent
  profile. Do not add `/recommend` to `proxy.ts` protected prefixes.
- OpenID does not include headline. Do not ask for extra LinkedIn API
  products unless the founder requests them.

### 6.3 Salary expectations, hidden both ways, feeds matching
Schema + private UI shipped 2026-09-08 (option 1 qualitative tag, **not**
wired into `matchScore` / `why-match.ts`).
- Talent: `talent_profiles.salary_expectation` via `0015_talent_salary_and_skills.sql`,
  collected in `ProfileWizard` step 6. `toTalentProfile` always zeros this
  field so company-facing surfaces never receive the number.
- Company: `roles.salary_min` / `salary_max` collected in the role builder.
  Never shown on role cards or candidate views.
- `/roles/[id]` lists pipeline contacts with `lib/roles/salary-alignment.ts`
  tags only: aligned (in range or below min), above budget, or not enough info.
- Matching-engine weighting is still a later design pass. Do not fold this
  tag into `MATCH_WEIGHTS`.
- **Distance / radius** on the role builder and talent commute radius are
  still not built. Discover km filter is 6.5 via Nominatim geocoding.

### 6.4 Calendar integration (Google/Outlook + internal calendar + team sub-users)
Internal v1 shipped 2026-09-08 (no Google/Outlook). Schema:
`supabase/migrations/0017_team_and_interviews.sql`. Founder pastes it in
the SQL Editor. External calendar OAuth stays blocked (item 5).
- `/team`: owner invites by name + email + role. Row is `invited`. Email
  uses the same Resend FROM / try-catch pattern. Invitees hitting company
  onboarding see "Join the team at {company}" and `claim_company_invite`
  instead of a new company profile.
- Conversation: company side gets "Schedule interview" (time, duration,
  video or in person, note). `/interviews` lists real rows. Talent sees
  the next scheduled interview in that conversation. Do not add Google or
  Outlook clients.

### 6.5 Advanced candidate search filters (item 14 — was missing from the
### first draft of this doc, added on review, see founder's verbatim text
### above for the original wording)
Company-side candidate search (`/discover`) already has a filter system —
this is an extension of it, not a new one from scratch:
- `components/discovery/DiscoveryFilters.tsx` — the filter form UI
  (`DiscoveryFiltersForm`), currently exposes industry / location / style.
- `lib/discovery/filters.ts` — `parseDiscoveryFilters()`, the URL-param ⇄
  filter-object parsing layer.
- `lib/discovery/query.ts` — `loadDiscoveryPage()`, where the actual
  filtered query executes.
- `app/discover/page.tsx` — wires the three together, also computes
  `filtersActive` for empty-state copy (line ~57-58).

Founder wants these filters added, all exposed through **one small popover/
modal panel** (her words: "a small window that opens where you can add
filters comfortably"), not more inline form fields cluttering the page:
- **Distance** — km slider in the company Discover filter panel. Location
  is still free text. On profile save, a server call to OpenStreetMap
  Nominatim (`lib/geocoding/nominatim.ts`, User-Agent required, no API
  key) stores `latitude` / `longitude` via `0018_geocoding.sql`.
  `distanceKm` follows the same URL-filter pattern as `yearsMin`. Haversine
  in `loadDiscoveryPage()`: if the company or a candidate has no
  coordinates, they are not dropped. Match scores / `MATCH_WEIGHTS` are
  unchanged. Do not add a role-builder radius or talent commute radius
  until asked. Founder still pastes `0018` in the SQL Editor.
- **Years of experience** — range slider, backed by the existing
  `talent_profiles.years_experience` column (already exists, no schema
  change needed). Founder explicitly asked for the range to be forgiving:
  build in a ±1.5–2 year tolerance on whatever bounds the recruiter sets
  (e.g. a company filtering for "5+ years" should still surface strong
  4-year candidates) rather than a hard cutoff — implement this as a
  padding applied server-side in `loadDiscoveryPage()`'s query, not just a
  UI hint, so it actually changes which candidates return.
- **Role/title** — text or select filter on whatever field currently holds
  the candidate's role/title (check `talent_profiles` schema for the exact
  column — likely `headline` or similar based on `CandidateRow.headline` in
  `components/dashboard/CompanyDashboard.tsx`).
- **Hybrid/remote toggle** — maps to the existing `workEnvironment`-style
  vocabulary talent profiles already collect (see
  `lib/onboarding/questions.ts` / talent's work-preference field — confirm
  exact column) — surface as a simple toggle/select (remote / hybrid /
  onsite / no preference), don't invent a new vocabulary.
- **Values/skills filter** — multi-select against the same values/skills
  taxonomy from item 5 (post the top-5-cap and expanded-options work) — a
  company filters for candidates whose top values overlap with what they
  select here.
- All of the above should compose into one query (AND logic across
  distinct filter types, i.e. narrows the result set), consistent with how
  `parseDiscoveryFilters` / `loadDiscoveryPage` already combine industry +
  location + style today — extend that same pattern rather than building a
  parallel filtering path.

---

## Open items requiring the founder, summarized

1. Upload the actual logo file (not pasted inline in chat) — blocks 1.1.
2. Confirm whether the "Find your next opportunity" / "Find your next great
   hire" per-audience copy is fine as-is, or should be unified — blocks
   nothing else, low priority.
3. LinkedIn OAuth app is registered. Confirm redirect URI
   `{APP_URL}/api/auth/linkedin/callback` and Vercel Secrets
   `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` (not `NEXT_PUBLIC_`).
   Redeploy after 6.2 is on `main`.
4. WhatsApp v1 is the `wa.me` deep link (candidate sends from their own
   chat). Business API is out of scope unless requested later.
5. Register Google Cloud Console + Microsoft Azure AD OAuth apps for
   Calendar API access — blocks the external-sync half of 6.4 (internal-
   only calendar can ship without this).
6. Confirm the salary-matching weighting proposal once drafted — blocks
   the scoring-logic half of 6.3 (the schema/field half can ship without
   this).
7. Run `supabase/migrations/0013_company_logo_storage.sql` manually via the
   Supabase SQL Editor — blocks company logo upload from working end to end
   even though the app code is already correct.
7b. Run `supabase/migrations/0014_company_roles.sql` in the same SQL Editor —
    blocks creating roles until `public.roles` exists (the /roles UI is
    already in the app).
7c. Run `supabase/migrations/0015_talent_salary_and_skills.sql` — blocks
    talent skills, salary expectation, and salary-fit tags.
7d. Run `supabase/migrations/0016_recommendations.sql` — blocks requesting
    and submitting recommendations (the UI degrades if the table/RPCs are
    missing).
7e. Run `0017_team_and_interviews.sql` and `0018_geocoding.sql` — blocks
    team invites, interview rows, and Discover distance until those
    columns/RPCs exist.
8. Talent commute radius on the profile, and a radius on the role builder,
   are still not built. Discover distance uses geocoded city text via
   Nominatim. Do not add those extra radius fields until asked.
