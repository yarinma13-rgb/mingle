# mingle.careers — SEO Strategy (Phases 1–7)

> Written by the Growth/Marketing agent (Claude), 2026-09-27. Phase 1 (audit) findings are
> based on a live-site check + full codebase read of `/Users/Yarin/mingle-app` at commit
> `2e7398e` (local) / `bfa0f57` (origin/main). **Update 2026-10-11: Phase 6 (technical
> implementation) has since shipped in full — see the status note at the bottom for what
> landed and what's still open.**

## Phase 1 — Audit summary (already delivered, repeated here for reference)

**Foundational gaps (fix first, near-zero cost):**
1. No `robots.txt`, no `sitemap.xml` — both 404.
2. `/careers/[companySlug]` (the product's highest-value SEO surface — one page per company's
   open roles) has no unique metadata, no OG image, no canonical, no JSON-LD `JobPosting`, and
   **no internal link anywhere in the site points to it** — it's orphaned.
3. `/` sets its own canonical to `/welcome` (reversed from the usual pattern); both URLs serve
   identical content with no redirect reconciling them.
4. No JSON-LD anywhere — no `Organization`, no `FAQPage` (a real FAQ already exists in
   `lib/landing/copy.ts` → `faq.items`, just not marked up as structured data).
5. The public marketing surface is effectively one page: `/`, `/welcome` (dupe), `/contact`,
   `/legal/*`. The audience-specific copy (below) already exists in code but only as
   client-side tabs, not real URLs.

**Already healthy:** title/description on every real page, OG on `/` and `/welcome`, full and
meaningful `alt` text, clean H1→H2→H3 structure, fast TTFB (~70ms), correct apex→www redirect,
content is server-rendered (not hidden from crawlers behind client JS).

---

## Phase 2 — Keyword strategy

Grounded in mingle's actual product language (pulled directly from `lib/landing/copy.ts`,
not invented): **Role Fit / Human Fit / Motivation Fit**, **Candidate DNA / Company DNA**,
**Match Confidence**, **mutual interest**, **"Why this match."** The core positioning is
explicitly *not* "just another AI recruiting tool" — it's mutual matching with an explained
"why," which should shape which keywords are worth targeting vs. skipped.

### Cluster A — Recruitment / hiring tools (company + recruiter intent)
Primary: `AI recruitment platform`, `AI candidate matching`, `candidate matching software`,
`AI hiring platform`, `skills based hiring`, `recruitment matching platform`.
mingle-specific long-tail (lower volume, much higher intent-match, easiest to rank and easiest
to convert because the content *is* the product): `why interviews don't predict job
performance`, `candidate matching with explanation`, `AI hiring with match confidence`,
`mutual matching recruitment platform`.
**Skip:** generic high-volume terms like `applicant tracking system` or `resume database` —
mingle explicitly isn't an ATS/résumé store (see FAQ: *"Most tools help you store or search
people. mingle ranks a short list and explains Why."*). Ranking for ATS terms would import
the wrong audience and the wrong problem framing.

### Cluster B — Candidate experience (talent intent)
`find the right job`, `job matching platform`, `personalized job matching`,
`jobs that match your skills`, `career matching`.
mingle-specific: `candidate DNA`, `why did I match this job`, `free job matching for
candidates` (talent side is free — a real differentiator worth its own keyword angle).

### Cluster C — Mutual matching (category-defining, low competition)
`mutual matching recruitment`, `two way candidate matching`, `candidate employer matching`,
`talent matching platform`. This cluster has low search volume today because it's closer to
a category mingle is helping define, not an existing search category — worth owning early
rather than competing on Cluster A's crowded terms.

### Cluster D — Hiring problems (top-of-funnel, problem-aware)
`CV screening problems`, `skills based hiring vs CV`, `candidate experience recruitment`,
`transparent hiring`, `why skills based hiring is changing recruitment`.

### Cluster E — Persona-specific (maps directly to the 5 existing audiences in code)
- Recruiters: `AI shortlist for recruiters`, `recruiter tools for candidate screening`
- Founders (no dedicated HR): `hiring for startups without a recruiter`, `founder hiring tools`
- Agencies: `recruiting agency matching software`, `explain candidate matches to clients`
- Companies: `reduce time to hire`, `candidate shortlist tool`
- Talent: `free candidate matching`, `understand why you match a job`

**Priority order for Phase 3 targeting** (impact × achievability, not raw volume):
1. Cluster C (mutual matching) — category-defining, near-zero competition, matches the actual
   product exactly.
2. Cluster E persona terms — each maps to a page that already has real, founder-approved copy
   sitting in the codebase, so the content-creation cost is close to zero.
3. Cluster D (hiring problems) — genuine top-of-funnel content, feeds the blog/content engine.
4. Cluster A's long-tail (not the crowded head terms).
5. Cluster B, once the talent side of the product needs more inbound (currently talent supply
   already exceeds company demand 4:1 per `docs/growth-reports/2026-09-15.md` — so candidate-
   side SEO is lower priority right now than company/recruiter-side; **flagging this explicitly
   because it changes the brief's default prioritization** based on real pilot data, not
   assumption).

---

## Phase 3 — Landing page architecture

Principle from the brief: every page must carry real, distinct value — no thin duplicate
pages targeting slightly different keywords with the same content.

### New pages to create (highest priority first)

| URL | Source of content | Primary keyword cluster |
|---|---|---|
| `/for-recruiters` | `lib/landing/copy.ts` → `audiences.recruiters` lead + relevant `why`/`compare` cards | Cluster E (recruiters), Cluster A long-tail |
| `/for-companies` | `audiences.companies` | Cluster A, Cluster D |
| `/for-founders` | `audiences.founders` (this is the *founder-no-HR* ICP from `outbound/config.py` — same persona targeted by the outbound pipeline, so this page and the outbound "magic link" can point at each other) | Cluster E (founders) |
| `/for-agencies` | `audiences.agencies` | Cluster E (agencies) |
| `/for-talent` | `audiences.talents` | Cluster B — deprioritized per the supply/demand note above, but cheap to ship alongside the others since the copy already exists |
| `/mutual-matching` (or `/how-it-works`) | New — explain Role/Human/Motivation Fit and Match Confidence as a standalone concept page, linking to `why`, `whyMatch`, `scores`, `dna` sections already written for the homepage | Cluster C |
| `/careers` (new — a public index/listing page) | New — lists published companies with open roles, linking to each `/careers/[companySlug]` | Fixes the orphan-page problem from the audit (Phase 1, item 2) — this is the single highest-leverage new page, since without it the flagship `/careers/[companySlug]` pages stay undiscoverable no matter what else ships |

**Not recommended right now:** a generic `/pricing` page — the product's pricing model
(free for talent, "talk to us" for hiring teams) doesn't lend itself to a self-serve pricing
page yet, and publishing one prematurely could conflict with the sales-assisted motion the
outbound pipeline is built around.

Each new persona page should reuse the existing `why`/`compare`/`faq` sections filtered to
that audience rather than being written from scratch — this satisfies both the brief's
"no duplicate content" rule (each page leads with a different, real lead-in) and the
"reuse existing components" rule (Phase 6 UI guidance).

---

## Phase 4 — Content engine: first 10–20 topics

Organized by audience, each answering a real question rather than being a disguised pitch —
per the brief's explicit instruction.

**Founders / companies:**
1. Why interviews don't predict job performance
2. Skills-based hiring vs. CV screening — what actually changes
3. How to hire your first employee without a recruiter (ties directly to the founder-no-HR
   ICP already defined in `outbound/config.py`)
4. What makes a good candidate-company match, beyond keywords
5. The real cost of a bad hire for a small team

**Recruiters / HR / agencies:**
6. What is mutual matching in recruitment?
7. How does AI candidate matching actually work? (a plain-language, non-hype explainer —
   important given mingle's "not salesy, not keyword-stuffed" brand rule)
8. Why "Match Confidence" matters more than a raw match score
9. How to explain an AI-driven shortlist to a hiring manager who doesn't trust black boxes
10. Employee referrals as a hiring channel — how they compare to open-market sourcing

**Candidates:**
11. What is Human Fit in recruitment?
12. What is Motivation Fit, and why does it matter as much as skills?
13. How can candidates understand *why* they match a job (not just that they do)?
14. Why "free forever for talent" is possible — the business model in plain terms (builds
    trust, addresses an obvious skeptical question)

**Category / positioning (feeds Cluster C):**
15. Two-way matching vs. one-way sourcing — what's the actual difference?
16. Why "Beyond the match" — mingle's take on what hiring platforms usually get wrong

Deliberately **not** included: generic "10 interview questions to ask" or "resume tips" listicle
content — high search volume, zero connection to mingle's actual differentiation, and exactly
the kind of traffic-for-traffic's-sake the brief says to avoid.

---

## Phase 5 — Programmatic / scalable SEO

**Recommendation: mostly hold off, with one exception already half-built.**

`/careers/[companySlug]` is *already* a legitimate programmatic pattern — one real page per
company, with real distinct content (their actual open roles), not a thin keyword page. The
only work needed here is fixing what's missing (Phase 1, item 2: metadata, OG, JSON-LD,
internal linking via the new `/careers` index page) — not building something new.

**Not recommended yet:** combinatorial pages like `/jobs/[role]-in-[city]` or
`/ai-recruiting-for-[industry]`. There's no real distinct content to fill thousands of such
pages today (would violate the brief's explicit "no thin pages" rule), and the company-supply
side of the marketplace is still small (2 companies in the last pilot window per the growth
report) — building a scalable page-generation system now would run far ahead of the content/
data needed to make each page real. Revisit once `/careers/[companySlug]` has enough real
published companies that a `/careers?location=X` or `/careers?role=X` filtered view would
surface genuinely different, non-thin results.

---

## Phase 7 (measurement) — what needs connecting

Checked `.env.example`: `NEXT_PUBLIC_POSTHOG_KEY`/`HOST` and `POSTHOG_PERSONAL_API_KEY` exist
as variables (PostHog is the analytics tool in use, not GA). No Google Search Console
integration exists anywhere in the codebase or docs.

**Status as of 2026-10-11:**
1. **Google Search Console** — Yarin added `mingle.careers` as a Domain property and verified
   it. ✅ Done.
2. **Sitemap submission** — submitted `https://www.mingle.careers/sitemap.xml` in GSC (the
   relative `sitemap.xml` path failed submission because `mingle.careers` 308-redirects to
   `www.mingle.careers`, and GSC's submission check doesn't follow redirects — the `www.`
   absolute URL resolves directly and was accepted). Awaiting first crawl/index status. ✅ Done,
   pending Google's first pass.
3. **PostHog UTM/referrer capture on signup events** — **still not verified.** Worth checking
   whether `$referrer` / `utm_source=google` is actually being captured on signup events before
   relying on PostHog to attribute organic-search conversions once GSC traffic data comes in.

---

## ✅ Status note — Phase 6 implementation (shipped 2026-10-10/11)

All planned technical SEO work has shipped to `main`:
- `app/robots.ts`, `app/sitemap.ts` (dynamic, includes career pages with open roles)
- `app/careers/[companySlug]/page.tsx` — metadata, OG/Twitter, JSON-LD `Organization` +
  `JobPosting` per role
- `app/layout.tsx` — site-wide JSON-LD `Organization`
- `components/landing/LandingPage.tsx` — JSON-LD `FAQPage`
- `app/contact/page.tsx` — OG/Twitter metadata
- `app/careers/page.tsx` (**new**) — public directory/index page listing companies with open
  roles, linking into each `/careers/[companySlug]` page. This was the single highest-leverage
  item from Phase 3 (fixes the "orphan page" problem from the Phase 1 audit) and is now live.

**Bug found and fixed along the way (unrelated to this SEO work, but blocking):**
`lib/careers/persistence.ts` had `listCareerPages` declared twice in the same file — a
TypeScript duplicate-function-implementation error that would have failed the Vercel build on
the next deploy. Root cause looks like a collision between this work and the dev agent's
in-progress work on the same file (see the original git-conflict note this replaced). Fixed by
keeping the implementation that filters to companies with ≥1 open role (matches this doc's own
stated intent for the sitemap/directory — never surface thin/empty career pages) and removing
the redundant duplicate. Verified post-fix: single `listCareerPages` definition, all other
exports (`loadCareerPage`, `hasAppliedToRole`, `applyToRole`) intact.

**Note on `app/careers/page.tsx`:** built against the `listCareerPages` signature that actually
exists on `main` (returns `{ slug }[]` via a direct table query, not the richer
`CareerPageListing` with company name/industry/etc. originally sketched in Phase 3 above) —
fetches full details per company via the existing `loadCareerPage(slug)`. Chose this over
extending `listCareerPages` itself to avoid changing a function the dev agent may still be
actively relying on elsewhere.

All changes verified live on `www.mingle.careers` post-deploy: robots.txt, sitemap.xml,
`/careers`, `/contact` all return 200; `Organization` and `FAQPage` JSON-LD confirmed present
in rendered HTML. `/careers` currently renders its empty state ("No open roles yet") since no
company in the pilot currently has both a slug and an open role — expected given current
pilot-stage supply, not a bug.
