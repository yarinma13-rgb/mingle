# MINGLE — Growth Learning System Handoff

Source: founder request 2026-09-12. Goal: build mingle's lightweight equivalent of
monday.com's BigBrain loop — measure usage, learn where value lives, act on what
can be fixed automatically, and send the founder a clear biweekly report.

Repo root for all paths below: `mingle/` (this workspace).

Read first, in order:
1. `docs/SYSTEM_DOCUMENTATION.md`
2. `docs/CURSOR_HANDOFF_PROMPT.md` (hard product constraints)
3. This document

Do **not** rebuild analytics from scratch. Extend what already exists.

---

## Founder intent (verbatim summary)

Build a monitoring + learning + lesson-extraction system that:
1. Tracks real user behavior in the product
2. Knows what "success" looks like (Aha moment + North Star)
3. Automatically improves what it can (onboarding nudges, emails, in-app prompts)
4. Every **2 weeks**, emails the founder a structured report:
   - What improved
   - What should be improved next
   - What is **outside the system's ability** to fix (needs founder / product decision)

This is a **Growth + Usage + Learning** system for Early Access — not an
Enterprise BI platform. Prefer simple, shippable loops over BigBrain clones.

---

## Current state (do not regress)

Already in code:

| Piece | Path | Notes |
|---|---|---|
| Event names | `lib/analytics/events.ts` | `signup`, `sign_in`, `profile_completed`, `connection_sent`, `mingle_created`, `message_sent`, `relationship_stage` |
| Track helper | `lib/analytics/track.ts` | PostHog browser + node; no-op without key; never throws |
| Identify | `identifyUser` in same file | Exists; wire where auth succeeds if missing |
| Init | `instrumentation-client.ts` | Calls `initPosthogBrowser()` |
| Env | `lib/monitoring/env.ts`, `.env.example` | `NEXT_PUBLIC_POSTHOG_KEY`, optional host |
| Sentry | `lib/monitoring/sentry.ts` | Errors only — keep separate from product analytics |

Graceful degradation stays mandatory: missing PostHog / Resend / tables = no crash.

---

## Part 0 — Prerequisites (blockers for real data)

Before the learning loop is useful in production:

1. Deploy the app (still localhost-only per docs).
2. Set real `NEXT_PUBLIC_POSTHOG_KEY` (+ optional host) in production env.
3. Set real `RESEND_API_KEY` and `NEXT_PUBLIC_APP_URL` (report email + product emails).
4. Confirm email: founder address for biweekly reports (default target:
   use env `FOUNDER_REPORT_EMAIL`; if unset, document the gap and skip send).

If keys are missing, still ship the code paths (no-op), plus a local/dev way to
generate the same report from Supabase + mocked events so the founder can review
the format.

---

## Part 1 — Define success metrics (product constants)

Create `lib/analytics/metrics.ts` (or similar) with **documented constants**, not magic numbers in UI:

### North Star

**Meaningful Match** = mutual interest that opens a real relationship.

In current product terms that is **`mingle_created`** (both sides connected).

Weekly North Star = count of `mingle_created` in the period.

Do **not** use signups, pageviews, or followers as North Star.

### Aha! Moment (first-session success)

A user reaches Aha when, within **48 hours** of signup, they complete:

**Talent**
1. `profile_completed` (or profile completion ≥ product threshold already used in UI)
2. At least one meaningful Discover action (see new events below: save and/or `connection_sent`)
3. Ideally: received or sent activity that leads toward a mingle (track even if not required for Aha v1)

**Company**
1. Company profile completed
2. At least one Discover browse with a match card viewed (new event)
3. At least one `connection_sent` **or** Board stage update on an existing connection

Ship Aha v1 as: `profile_completed` + (`connection_sent` OR `mingle_created`) within 48h.
Refine once data exists — do not invent ML health scores yet.

### Funnel (canonical)

Document and instrument this ladder:

```
visitor
  → signup
  → path chosen (talent | company)
  → onboarding_complete
  → profile_completed
  → discover_viewed / match_card_viewed
  → connection_sent
  → mingle_created          ← North Star
  → message_sent
  → relationship_stage advanced (Exploring → … → Decision)
  → returning_user (session in week 2)
```

Marketplace health (report section, not North Star):
- active companies with completed profiles
- active talents with completed profiles
- ratio talent:company (flag imbalance)
- % of companies with ≥1 connection_sent
- % of talents who sent or received a connection

---

## Part 2 — Complete event instrumentation

### 2.1 Extend `lib/analytics/events.ts`

Add at least:

```ts
// Acquisition / activation
onboardingStarted: "onboarding_started",
onboardingCompleted: "onboarding_completed",
onboardingAbandoned: "onboarding_abandoned", // step name in props
discoverViewed: "discover_viewed",
matchCardViewed: "match_card_viewed", // props: score, other_user_type
profileSaved: "profile_saved",
boardStageChanged: "board_stage_changed",
inviteSent: "invite_sent", // when invite/recommendation flows exist
returningSession: "returning_session", // 7+ days after signup, or 2nd week session
```

Keep existing events. Do not rename breaking names already documented.

### 2.2 Wire `track(...)` at real call sites

Search and instrument (examples — verify exact files):

- Auth success → `signup` / `sign_in` + `identifyUser(userId, { user_type })`
- Onboarding step enter/leave → started / abandoned / completed
- Profile complete → already `profile_completed`; ensure `user_type` + `completion` props
- Discover page load → `discover_viewed`
- Opening/focusing a match card → `match_card_viewed` + `score`
- Save profile → `profile_saved`
- Connection / mingle / message / stage → already partly tracked; ensure props include `user_type`, ids where safe
- Board drag → `board_stage_changed` + `from` / `to`

Props rules:
- Always include `user_type` when known (`talent` | `company`)
- Never send PII (email, full name, CV text) into PostHog props
- Prefer ids + coarse attributes (industry, score bucket)

### 2.3 Server-side truth table (optional but preferred for reports)

PostHog alone can go missing if key unset. For biweekly reports, also compute from
**Supabase** (source of truth for connections, messages, relationship_events, profiles):

Add a server module e.g. `lib/analytics/funnel-snapshot.ts` that, for a date range, returns:

- signups by `user_type`
- profiles completed
- connections sent / accepted / mingles
- messages
- stage distribution
- returning users (users with activity in window who signed up before window)
- aha rate (users who hit Aha definition within 48h of signup, among signups in window)

Use the existing Supabase server client patterns. Respect RLS — if service role is
unavailable, document that report generation must run with a privileged path the
founder configures, **or** aggregate only what the report runner's role can read.
Do not commit a service role key.

---

## Part 3 — Lightweight automation loop (what the system MAY auto-fix)

Build a small rules engine, not ML. File sketch: `lib/growth/rules.ts` + runners.

### Rules the system is allowed to execute automatically

| Trigger | Auto action | Channel |
|---|---|---|
| Signed up, no profile complete after 24h | Nudge: finish profile | email (Resend) and/or in-app toast on next login |
| Profile complete, no Discover view after 24h | Nudge: open Discover | email / in-app |
| Match card viewed score ≥ 70, no connection in 24h | Nudge: send connection | in-app |
| Connection sent, no reply 72h | Soft reminder to sender (patience + tip) | email |
| Mingle created, no message in 24h | Nudge: start conversation | email / in-app |
| Company with mingle, never opened Board | Point to `/board` | in-app once |

Reuse Resend patterns in `lib/email/*`. New templates under same FROM
`mingle <noreply@mingle.careers>`. Missing API key = skip send, log no-op.

Rate-limit nudges (e.g. max 1 automated email per user per 48h; never spam).

### What the system must NOT auto-change

- `MATCH_WEIGHTS`
- Pricing / paywalls
- Copy of core brand landing without founder approval
- Deleting users or connections
- Changing RLS / auth
- Spending ad budget or calling Meta/Google Ads APIs (out of scope for v1)
- Shipping UI redesigns based on a single metric dip

Those belong in the biweekly report under **Needs founder decision**.

---

## Part 4 — Biweekly founder report (required deliverable)

### 4.1 Schedule

Every **14 days**. Prefer:
- GitHub Action cron (`0 8 */14 * *` or weekly job that no-ops unless due), **or**
- Vercel cron / Route Handler `GET /api/internal/growth-report` protected by
  `CRON_SECRET` header

Document how to trigger manually: `npm run growth:report` (script calling the same builder).

### 4.2 Output

1. **Email** to `FOUNDER_REPORT_EMAIL` via Resend (HTML + plain text)
2. **Persisted artifact** in repo or storage the founder can open:
   - Preferred for Cursor cloud / git workflow: write
     `docs/growth-reports/YYYY-MM-DD.md` when the job runs in an environment with
     write access; if production cannot commit, write to Supabase table
     `growth_reports` (migration) **or** email-only + log URL
   - Pick one persistence path and document it; email is mandatory

### 4.3 Report structure (exact sections)

```markdown
# mingle growth report — {start} → {end}

## 1. North Star
- Meaningful matches (mingle_created): N (Δ vs prior period)
- One sentence: better / worse / flat, and likely why if known

## 2. Funnel snapshot
Table: stage → count → conversion from previous stage
Split talent vs company where possible

## 3. Marketplace balance
Talent:company actives, warning if severely imbalanced

## 4. What improved (system or product)
Bullets of positive deltas (e.g. aha rate 12% → 21%; nudge X sent to Y users)

## 5. What to improve next (prioritized)
Max 5 items. Each item:
- Observation (data)
- Hypothesis
- Suggested fix
- Owner: `auto` | `eng` | `founder`

## 6. Auto-actions taken this period
List nudges/emails fired + counts

## 7. Outside system ability (founder only)
Examples: cold outreach reply rates, ICP choice, pricing, brand positioning,
seed supply for marketplace, ad creative strategy, legal, partnerships

## 8. Experiments to run next 14 days
1–3 concrete tests (message, audience, onboarding step) — not feature wishlist
```

Tone: direct Hebrew or English is fine; prefer **Hebrew** for the founder email
body if templates are Hebrew elsewhere, else English with clear numbers. Be
decisive; no generic “consider exploring…”.

### 4.4 Baseline / first run

On first run with little data, still send the report:
- Show zeros honestly
- Section 7 should say Early Access needs seeded Discover liquidity
- Do not invent vanity success

---

## Part 5 — Minimal admin visibility (optional stretch)

If time remains after Parts 1–4:

- Internal page `/dashboard/growth` **only for a hardcoded allowlist email**
  (env `FOUNDER_REPORT_EMAIL`) showing last snapshot
- Or link in the biweekly email to PostHog dashboards (document URLs)

Do not build a full BI product.

---

## Part 6 — Implementation order (must follow)

1. `lib/analytics/metrics.ts` — North Star + Aha + funnel definitions
2. Extend events + wire call sites
3. `funnel-snapshot` from Supabase (+ PostHog if key present)
4. Report markdown builder + Resend email
5. Cron / `npm run growth:report` + secrets documented in `.env.example`
6. Growth nudge rules (start with 2–3 highest-impact only)
7. First manual report committed under `docs/growth-reports/` as a sample using
   whatever data exists (even empty) so the founder sees the format
8. Update `docs/SYSTEM_DOCUMENTATION.md` § analytics with new events + report job

---

## Hard constraints

- Follow `docs/CURSOR_HANDOFF_PROMPT.md` product rules (theme, MATCH_WEIGHTS, RLS, etc.)
- Analytics never blocks UX
- No service role in git
- No Meta/Google Ads auto-bidding in v1
- No “AI insights” fluff without numbers
- Keep scope pilot-sized: ship a closed loop, not monday BigBrain

---

## Definition of done

- [ ] New events defined and fired on real paths
- [ ] Snapshot computes funnel + North Star for a date range
- [ ] `npm run growth:report` (or equivalent) produces the 8-section report
- [ ] Email sends when Resend + `FOUNDER_REPORT_EMAIL` set; no-ops safely otherwise
- [ ] At least 2 automated nudge rules live (or clearly flagged behind env)
- [ ] Sample report file exists under `docs/growth-reports/`
- [ ] SYSTEM_DOCUMENTATION updated
- [ ] Lint + build pass; e2e not required to cover email cron

---

## Out of scope (explicit)

- Full customer-success health scores / churn ML
- Land-and-expand sales alerts for Enterprise
- Automatic ad budget shifting
- Multi-product upsell (CRM etc.)
- Replacing founder-led outreach

When in doubt: measure Meaningful Matches, shorten time-to-Aha, report every 14 days.
