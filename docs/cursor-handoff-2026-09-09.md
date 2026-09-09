# MINGLE — Design & Feature Handoff (2026-09-09)

Source: founder feedback after letting a real outside person use the app for
the first time. This is a second, separate handoff from
[cursor-handoff-2026-09-07.md](./cursor-handoff-2026-09-07.md) — read that
one's "Already done" section first so you don't redo work from the 7th.
Same rules as last time: this doc assumes no memory of the conversation that
produced it, states current vs. desired behavior with exact files/lines, and
flags founder decisions explicitly rather than guessing them.

Repo root for all paths below: `mingle/`.

---

## Founder's original request — verbatim (2026-09-09)

> אחרי שנתתי למישהו להשתמש עם האפליקציה יש לי כמה תיקונים:
>
> 1. המסך כניסה לאפליקציה: תחליף את האייטמים של האיש ושל הבניין כשצריכים
> לבחור אם זה טאלנט או אפורטוניטי הצבעים לא אהבתי אותם תשתמש בצבעים:
> * 🩷 Pink — #EA1E63
> * 🟣 Purple — #7B2FF7
> * 🔵 Blue — #3E6BE0
> בנוסף במסך זה, כשלוחצים על בחירה מסוימת כל אחד והקטגוריה שמתאימה לו אז
> שזה ישר יעבור למסך הבא לא צריך גם את כפתור "LETS STARTED" אלא אם כן
> אנחנו עושים מסך פתיחה רק של לוגו ואז את הכפתור הזה ומשם זה עובר למסך של
> לבחור את הסגמנט.
>
> 2. תעשה את כל האפליקציה כרספונסיבית כלומר שיתאים לכל גודל של כל מקור
> שפותחים אותו כי אז הוא ניהיה חתוך למשל אם פותחים את זה באייפון.
>
> 3. אני צריכה שתוסיף אופציה שאם זה משתמש חדש אז יהיה "SIGN UP" ואם זה
> משתמש קיים שתהיה האופציה ל-"SIGN IN".
>
> 4. תנסה שהכל יהיה ONE CLICK אלא אם כן צריך לבחור מכמה אופציות ואז זה
> אופציות בחירה.
>
> 5. תתקן PLACE HOLDERS.
>
> 6. תייצר קומפוננטה של AUTO SUGGEST.
>
> 7. בשנות ניסיון בבניית פרופיל- שתהיה תיבה שנפתחת עם אופציות מתאימות
> למשל NUMBER PICKER.
>
> 8. אתה חייב לייצר כוכביות בפרטים שהם חובה לסמן אותם ולא לתת לעבור למסך
> הבא ללא מילוי שלהם. למשל מין זה לא חובה, אבל ניסיון/שכר/מיקום- תתן את
> האופציה לבחור כי זה ניראה לי לא חוקי לחייב מיקום.
>
> 9. אתה חייב להגביל את מה שכותבים בתיבה למשל - שלא יהיה ניתן לכתוב צ'ש
> של מעל 90,000. כמו כן, תתאים את השפה שכתובה כך שתתאים לדברים למשל אם
> מישהו כותב ב"מה גורם לך לדרייב" הוא מצרף ערך של "MONEY" ואחד אחר כותב
> "SALARY" אז זה צריך להיות תחת אותה קטגוריית התאמה מול המאצ' שיהיה להם.
> כלומר שתי המילים הן אותה משמעות בסופו של דבר.
>
> 10. אתה צריך ליצור אחידות למשל אם מישהו כותב "SALARY" בספרדית, האם זה
> מתאים ל-"SALARY" או ל-"משכורת" מבחינת הערכים? האם זה יופיע למגייסת
> ישראלית באנגלית/עברית ולא בספרדית?
>
> 11. בהמשך לסעיף הקודם במסך פתיחה מצד ימין למעלה צריך שתהיה תיבה להחלפת
> שפות כדי להתאים את השפה שאתה רוצה להשתמש בה באפליקציה. אז תעשה סימן של
> כדור הארץ לא אימוג'י אלא אלמנט יפה ותכתוב "LANGUAGE" כלומר "שפה" באנגלית.
>
> 12. תתאים את הגודל של הפרופיל (של חברות כשמועמדים מסתכלים בהיצע) ו-(של
> מועמדים כשחברות/מגייסות מסתכלות בפרופיל של מועמדים) לגודל שמתאים ל-SWIPE
> כמו באפליקציות היכרויות זה הפרופורציה.
>
> 13. פרופילים (גם של חברות וגם של טאלנטים) שמוצגים חייבים וצריכים להיות
> יותר ויזואליים בהצגה שלהם בהיצע או בדיסקאבר.
>
> 14. להגדיר התראות שנכנסות בפוש לטלפון כשיש מאצ'/הודעה או כל התראה חשובה.
>
> 15. האתר מאוד איטי בבקשה תסדר את זה.
>
> 16. כשאני לוחצת על ההתראה כדי לצפות מה יש שם אז אני רואה שהתראה שמועמד
> שלח לי בקשת חברות וכשאני מנסה ללחוץ ולהיכנס לפרופיל שלו זה לא לחיץ.
>
> 17. כשמשתמש קיים חוזר לאפליקציה יש מסכים לא רלוונטיים כמו: "BUILD
> PROFILE" ו-"LOOKS GOOD" עם כל הפרטים של הפרופיל.
>
> [inline, unnumbered in the original] שים לב לסימון קטגוריות בתוך הדשבורד
> שהרקע לא פרופורציונלי לכיתוב כלומר זה לא באמצע.
>
> 18. במענה על שאלות ב-ADD PILLS שיהיה אך ורק אותיות ולא אופציות לכתוב
> מספרים וחייב שזה יהיה מילה הגיונית ולא חירבוש. כמובן שאיפה שצריך לכתוב
> מספרים כן תאפשר מן הסתם לכתוב מספרים למשל אם מדובר בציפיות שכר.
>
> 19. תוסיף בתוך הבניית פרופיל כשהם מגדירים מה הם מחפשים מד מרחק עבור
> נסיעה מהבית כלומר X ק"מ באמצעות מד נגיש שיראה טוב.
>
> 20. מבחינת SKILLS - זה חייב להתחלף בהתאם לתחום של התפקיד שהמועמד ממלא
> בהתחלה, וכמו כן גם כשחברה רוצה לגייס לתחום של מרקטינג שיהיה לה רשימת
> סקילס לבחור בהתאם לתחום, וזה בשונה מתחום של פיתוח או פארמה וכד'.
>
> 21. כשיש את המסך של "בדיקת הפרופיל שמילאת" ואז צריך ללחוץ "LOOKS GOOD" -
> זה חייב להיות קבוע בניראות עם אופציה של עריכה (EDIT) בצד, כלומר אם
> הטאלנט רוצה לשנות שכר למשל אז שהשכר שיופיע במסך הזה לפני האישור הסופי
> יהיה ניתן לעריכה, ומתחת בסוגריים לכתוב שזה נתון פרטי ושאינו מופיע חשוף
> לחברות.

Numbering note: the founder's message has two items both labeled "2" (the
responsiveness item and the Sign Up/Sign In item) and skips from "17" to an
unnumbered dashboard-icon note back to "18" — this doc renumbers everything
sequentially 1–21 below in the order she wrote them, and each section below
states which of her original items it covers so nothing gets lost in
translation.

---

## Part 1 — Quick, unambiguous fixes (no founder decision needed)

### 1.1 (her #1) Welcome screen — glyph colors and one-tap flow
`components/PathGlyph.tsx` — both `TalentGlyph` (lines 26–54) and
`CompanyGlyph` (lines 60–99) already pull from a shared `GradientDefs`
(lines 10–20, pink→purple→blue) — **they already use the identical
gradient for both cards, which is itself the problem**: the founder can't
tell them apart color-wise. Give each glyph its own distinct treatment
within the same three-color palette (`#EA1E63` / `#7B2FF7` / `#3E6BE0`) —
e.g. talent glyph weighted pink→purple, company glyph weighted
purple→blue, so the two cards read as visually distinct at a glance
instead of both rendering the same gradient.

On the "no extra button" ask: `components/WelcomeScreen.tsx` — selecting a
card only sets local state (line 88, `onClick={() => setSelected(card.id)}`)
and a separate **"Get Started" button** (lines 117–130, disabled until a
card is picked) is required to actually navigate (`handleGetStarted`,
lines 37–56, → `/auth?path=${selected}`). The founder gave you the exact
resolution herself: **make card selection navigate immediately** (drop the
button, fire the same navigation `handleGetStarted` already does, directly
from the card's `onClick`), **and** if you want a pure logo/brand splash
moment before this screen, add a *separate* new screen for that (logo +
one continue button) that leads into this card-selection screen — but the
card-selection screen itself should not have its own second confirm step
once a card is tapped.

### 1.2 (her #16) Notification click-through goes to the wrong place
`components/dashboard/NotificationBell.tsx` — this is **not fully broken**
(the founder's report of "not clickable" is close but not exact): every
notification item already renders as a real `<Link>` (lines 92–123), and
`itemHref()` (lines 18–20) does navigate — but a connection-request
notification resolves to `/connections` (the general list), not the
specific person's profile. Fix `itemHref()` so a connection-request item
links to that specific sender's profile (e.g.
`/profile/view/${item.senderId}` or the company equivalent — check
`app/profile/view/[userId]/page.tsx` for the exact route shape), not the
generic list.

### 1.3 (her #17 + the unnumbered dashboard note) Returning users hit irrelevant onboarding screens
Confirmed real gap, not a misunderstanding: `AuthForm.tsx` line 132 routes
**every** successful sign-in — new or returning, complete profile or not —
to `/onboarding/${path}`. From there:
- `components/OnboardingWizard.tsx`: once onboarding is done, it still
  renders an intermediate `OnboardingComplete` screen (function at lines
  399–430) — the "You're all set" screen with a "Build my profile" button
  (lines 423–428) — even for a user who finished this ages ago.
- `components/ProfileWizard.tsx` / `components/CompanyProfileWizard.tsx`:
  `resumeStep()` (`lib/profile/persistence.ts` lines 68–76) returns the
  final step number for a complete profile, which renders the
  `ProfilePreview` **review** screen ("Looks good" button) again — so a
  returning fully-onboarded user re-walks onboarding-complete → profile
  review, every single login.

**Fix:** after a successful sign-in in `AuthForm.tsx`, check
`onboarding_status`/`onboarding_step` (same columns `lib/onboarding/persistence.ts`
already reads) — if onboarding AND profile are both already complete,
route straight to `/dashboard`. Only route through `/onboarding/{path}` for
a user who is actually mid-flow or brand new. There's no `middleware.ts`
in this repo today — this check belongs in `AuthForm.tsx`'s post-auth
redirect logic (or a shared helper it calls), not a new middleware file,
to stay consistent with how the rest of the app already gates access
(`app/dashboard/page.tsx` does its own `redirect()` checks per-page, no
central middleware).

On the unnumbered dashboard note ("category background isn't centered to
the text"): `components/dashboard/IconBadge.tsx` (36 lines) already uses
plain `flex items-center justify-center` (lines 28–33) on the colored
square — no obvious bug in this component itself. If something still
looks off-center, it's most likely the individual icon SVGs in
`components/dashboard/icons.tsx` having uneven internal padding/viewBox,
not `IconBadge`'s layout. Check that file's `viewBox`/path bounding boxes
before changing `IconBadge`.

### 1.4 (her #3) Distinguish Sign Up vs. Sign In
`components/AuthForm.tsx` currently has **no** sign-up/sign-in distinction
at all — one generic "Continue" button (lines 261–269) that tries
`signUp()` first and silently falls back to `signInWithPassword()` on an
"already registered" response (lines 44–134, see the comment at 48–50
explaining this was a deliberate anti-friction choice: "a single
'Continue' instead of forcing the user to pick sign-up vs. log-in up
front"). The founder is now asking to reverse that deliberate choice —
confirm this is intentional (it undoes a specific earlier design decision,
not a bug), and if so, split into two explicit modes/buttons with the
labels she asked for ("Sign Up" / "Sign In"), keeping the same underlying
`supabase.auth` calls.

### 1.5 (her #7) Years of experience — number picker, not free text
`components/ProfileWizard.tsx` lines 387–397 — currently a plain
`<input type="number">` bound via `react-hook-form`
(`register("yearsExperience", { valueAsNumber: true })`). Replace with a
picker (dropdown or stepper) offering a bounded, sane range (e.g. 0–40)
instead of a free-typed number.

### 1.6 (her #9, numeric-cap half only — see Part 2 for the harder half) Input caps
Add a sane upper bound to numeric free-entry fields, starting with
`salary_expectation` on `talent_profiles` (added in migration `0015`) and
`salary_min`/`salary_max` on `roles` (migration `0014`) — the founder's
example was a monthly ILS figure ("צ'ש" = ש"ח/shekels) capped around
90,000. Confirm the exact ceiling and currency assumption with her before
hardcoding it (a candidate paid in USD or annually would break a flat
90,000 cap) — likely needs a currency field alongside the number, or an
explicit "this is monthly ILS" label, rather than just a silent number cap.

### 1.7 (her #18) Chip/pill input validation
`components/CustomChipInput.tsx` (52 lines) — `submit()` (lines 16–21)
today only checks `value.trim()` is non-empty; the `<input>` (lines 25–40)
has `maxLength={48}` and no character-set restriction. This is the shared
free-text-add component used by `ChipMultiSelect.tsx` (added yesterday,
commit `cc9a682`) across `ProfileWizard.tsx`, `OnboardingWizard.tsx`, and
`CompanyProfileWizard.tsx`. Add validation to `submit()`: reject
pure-digit or digit-heavy strings, reject strings with no vowel-like
pattern / excessive repeated characters (a lightweight sanity filter, not
a real dictionary check — a true "is this a real word" check is a much
bigger NLP task, out of scope here), keep a reasonable minimum length.
**This component is shared** — a numeric context (salary custom-entry, if
one exists) must NOT go through this same validator, or must pass a prop
that flips it into numeric-allowed mode. Check every call site before
tightening the default.

### 1.8 (her #19) Commute-distance slider on the talent profile builder too
Migration `0018` (2026-09-07) already added `latitude`/`longitude` to
`talent_profiles`, and `lib/discovery/filters.ts` already has a
`distanceKm` company-side Discover filter. The founder now wants the
*same* accessible distance slider concept **also surfaced inside the
talent profile builder itself** (framed as "how far are you willing to
commute", not a search filter) — likely a new optional field
`max_commute_km int` on `talent_profiles` (new migration needed), shown as
the same slider UI/component pattern as whatever the Discover-side
distance filter already uses, for consistency.

---

## Part 2 — Needs a founder decision before building (do not guess these)

### 2.1 (her #9 second half + #10) Cross-language / synonym value matching
This is the hard part of item 9, and all of item 10. Two distinct
problems bundled together in her message:

**(a) Synonym unification within one language** — "Money" vs "Salary"
should count as the same underlying value for matching purposes. Right
now every value/drive (`drives`, `values`, `work_style`, custom-added
chips via `CustomChipInput`) is stored as a raw string and compared by
exact/lowercase match (`lib/profile-detail/why-match.ts` `overlap()`,
lines 4–7) — "Money" and "Salary" are two unrelated strings today, no
canonicalization exists anywhere.

**(b) Cross-language equivalence** — "Salario" (Spanish) should be
recognized as equal to "משכורת" (Hebrew) and to "Salary" (English), *and*
whichever recruiter views it should see it rendered in **their own**
language, not whatever language the original person typed it in. This
requires the app to have a translation/locale layer at all, which — per
research — **does not exist anywhere in this codebase today** (confirmed:
no `next-intl`/`i18next`, no `lib/i18n`, no `[locale]` route, package.json
has none of this).

**Why this needs your decision before Cursor builds anything:** solving
(a) well requires either (i) a curated synonym/canonical-value dictionary
maintained by hand (small effort, but someone has to write and keep
updating the dictionary), or (ii) an embedding-based semantic-similarity
match (no manual dictionary, but needs an embeddings API call — a new
external dependency/cost, and fuzzier/less predictable results). Solving
(b) on top of that means either constraining free-text value entry to a
**closed, pre-translated list per language** (simplest, but contradicts
item 6.5/item 18's "let people type their own value" flexibility already
shipped), or building real machine-translation into the matching pipeline
(expensive, another external API, more moving parts).

**Recommendation to bring back to her:** ship (a) first, cheaply, with a
small hand-curated synonym map (a JSON file: canonical value → array of
known synonyms, English-only for now) — this alone likely resolves most of
what she's actually seeing day to day. Treat (b), true multi-language
value matching + display-language translation, as a separate, larger
project gated on whether MINGLE actually expects non-Hebrew/non-English
value input at this stage of the pilot — ask her whether that's a real
near-term need or a "nice to have I noticed once."

### 2.2 (her #11) Language switcher — depends on 2.1's answer
A visible language switcher (globe icon, not an emoji — an actual SVG/icon
component; label "Language" in English per her spec) on the welcome
screen top-right implies the **UI itself** becomes multi-language, which
is a materially bigger scope than just the value-matching question above
— every hardcoded English string in the app (buttons, labels, empty
states, emails) would need a translation layer (`next-intl` or similar)
to make a language switch mean anything beyond decoration. Confirm with
her: is this switcher meant to (i) actually translate the whole app UI
(large, multi-day scope, needs `next-intl` + translated copy for every
screen), or (ii) just control which language *her own free-text value
input* is interpreted/displayed in (smaller scope, ties directly to 2.1)?
Do not start building a UI-wide translation system without this
confirmed — it's too large to guess into existence.

### 2.3 (her #14) Push notifications
Confirmed **zero existing infrastructure** for this — no service worker,
no `manifest.json`, no push library in `package.json`. This needs: (i) a
PWA manifest + service worker (`public/sw.js`) so the site can even
register for push, (ii) a push provider — most likely the **Web Push API**
directly (VAPID keys, no account needed, works cross-browser) rather than
Firebase Cloud Messaging (needs a Google/Firebase project — another
external account registration, same category as Sentry/PostHog/LinkedIn
earlier), (iii) server-side triggering wired into wherever matches/messages
are already created. Recommend Web Push API specifically so this doesn't
pick up a new external-account blocker. This is a real multi-day feature,
not a quick add — worth scoping as its own handoff item once she confirms
she wants Web Push (no new account) vs. Firebase (better delivery
reliability on some browsers, costs an account signup).

### 2.4 (her #15) "The site is slow"
No specific slow screen/action was named, so there's nothing concrete to
fix yet — guessing at a fix here would likely target the wrong thing.
**Next step is measurement, not a code change:** run Lighthouse (or
Vercel's own Speed Insights, which is already visible in the Vercel
sidebar per earlier screenshots this project) against the production URL,
and separately ask the founder *which specific screen or action* felt
slow (initial page load? Discover search? switching between dashboard
tabs? uploading a photo?). Bring back concrete numbers/a specific
bottleneck before touching code.

### 2.5 (her #20) Skills list that changes by role/field
Both talent (their own skills, based on the field they say they work in)
and company (a role's required-skills options, based on the role's
department/field from the `0014` migration's `department` column) need a
**skills-taxonomy-by-category** dataset — e.g. Marketing → {SEO, content
strategy, paid social, ...}, Engineering → {React, Python, Kubernetes,
...}, Pharma → {GMP, regulatory affairs, ...}. This dataset doesn't exist
anywhere in the repo today (only the flat, ungrouped option lists in
`lib/onboarding/questions.ts` / `lib/company-profile/questions.ts`).
Building it well means someone curates real per-field skill lists — ask
the founder which fields/categories MINGLE actually needs to support at
launch (a handful of core ones, or a large exhaustive taxonomy) before
Cursor invents a list that might not match her actual target industries.

---

## Part 3 — Design/visual work (real effort, no blocker, just needs care)

### 3.1 (her #12, #13) Discover cards — swipe-app proportions, more visual
`components/discovery/DiscoveryScreen.tsx` — cards today (container class
at lines 186–188) are a **vertical stacked list of full-width rows**, no
`aspect-*` or fixed width/height anywhere in the file — the opposite of a
dating-app portrait tile. This is a real redesign: fixed aspect ratio
(roughly 3:4 to 2:3 portrait, per her ask), photo/logo given much more
visual weight than today's small avatar-plus-text-rows layout, applied to
both the talent-viewing-company and company-viewing-talent card variants.
Treat as a genuine design pass, not a CSS tweak — worth a quick mockup
check-in with the founder before wiring it everywhere, given how much of
Discover's layout this touches.

### 3.2 (her #21) Persistent, editable profile review screen
The review screen ("Looks good" — `components/ProfilePreview.tsx`, button
at line 188) should stop being a one-shot "confirm and move on" screen and
become a **standing summary with inline Edit per field**. Concretely: each
field shown (including salary) gets an inline "Edit" affordance that lets
the person change it right there without leaving the screen or restarting
the wizard step; the salary field specifically needs a small parenthetical
note under it — something like *"(private — not shown to companies)"* —
reusing the same "never expose this" framing already established for
`salary_expectation` in the `0015` migration and its handling in
`why-match.ts`/the salary-alignment work from the 7th.

### 3.3 (her #4, #5, #6) General UX polish — needs concrete examples, not guesses
Three related but vague asks:
- **#4 "everything one click unless it's a real choice"** — a design
  principle to apply screen-by-screen, not a single ticket. Cursor should
  flag specific redundant-confirmation steps it finds while doing the
  other work above (e.g. the onboarding-complete screen from 1.3 is
  exactly this kind of extra click) rather than doing a separate audit
  pass for this alone.
- **#5 "fix placeholders"** — too vague to act on without examples (which
  placeholders, what's wrong with them — unclear copy? wrong language?
  missing entirely on some field?). Ask the founder for 2–3 concrete
  screens/fields where a placeholder is bad before touching this broadly.
- **#6 "build an autosuggest component"** — no specific field named where
  it's needed (company name on signup? job title? location?). Confirm
  which input(s) she wants this on before building a generic component
  with no consumer.

### 3.4 (her #2) Full responsiveness pass
No `middleware.ts`/breakpoint audit exists — this needs real device
testing (iPhone widths especially, per her explicit example), not a
blanket CSS change. Check the screens most recently built this week first
(Roles builder, Team invite flow, Interview scheduling, the new
Discover filters panel) since those are newest and least likely to have
had mobile QA yet, then sweep the rest.
