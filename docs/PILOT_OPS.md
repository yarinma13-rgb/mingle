# Pilot ops checklist — mingle

Code on `main` already covers the product UX closeout. What is left is **founder ops**. Do these in order.

**Status as of 2026-09-28:** sections 1–3 below are verified done (checked live against Supabase + Vercel). What's left is section 4 (manual smoke test) — nobody has walked through it end-to-end yet.

## 1. Supabase SQL (SQL Editor) — done, verified 2026-09-28

Run any not-yet-applied migrations from `supabase/migrations/` in order, especially:

- `0011` … `0030` (push, roles, salary, commute, calendar, GitHub signal, rediscovery, etc.)

If a migration errors as "already exists", skip and continue.

**Verified 2026-09-28:** every migration through `0045` (the full current list in `supabase/migrations/`, including the newer `0040`–`0045` batch from other agents' work — growth nudges, talent referrals, acquisition channel, matches anchor, match explanations cache, learning-table FK/RLS retrofit) is applied in production — spot-checked via `information_schema`/`pg_policies` against the live DB, not just "file exists in repo."

## 2. Supabase Auth — done, verified 2026-09-28

- Enable **email confirmation** — ✅ confirmed ON in Supabase Auth → Sign In / Providers.
- Confirm URL template:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- **Google OAuth branding — closed, not via the path described below.** The `*.supabase.co` branding problem was fixed for **$0/month** by moving "Continue with Google" off the Supabase Auth redirect entirely (Google Identity Services popup + server-side token exchange) instead of paying for a Supabase custom domain. See **`docs/AUTH_GOOGLE_BRANDING.md`** for the full writeup — its checklist is now checked off, confirmed by Yarin in production. The custom-domain / `auth.mingle.careers` / `NEXT_PUBLIC_SUPABASE_URL` change described there (and below) was the original, now-superseded plan — do **not** apply it; it costs money and isn't needed for this problem.

## 3. Vercel env (production) — done, verified 2026-09-28

Copy from `.env.example` and fill:

| Key | Why |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth + data |
| `NEXT_PUBLIC_APP_URL` | Absolute links / OAuth callbacks |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` (+ host) | Product analytics |
| `POSTHOG_PERSONAL_API_KEY` / `POSTHOG_PROJECT_ID` | Founder insights email |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web push |
| `RESEND_API_KEY` / `FOUNDERS_REPORT_EMAIL` / `CRON_SECRET` | Email + cron |
| `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` | LinkedIn OAuth |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Calendar sync |
| Google Auth provider (Supabase Auth → Providers) | Enables **Continue with Google** on `/auth` |
| `GITHUB_TOKEN` | Optional GitHub rate limits |
| `ADMIN_EMAILS` | Admin / founder inbox fallback |

Generate VAPID once:

```bash
npx web-push generate-vapid-keys
```

Redeploy after saving env.

**Verified 2026-09-28:** every required var above is set in Vercel production. `GITHUB_TOKEN` (optional, GitHub rate limits) and the optional `DISCOVER_DOMAIN_EXEMPT_*` / `GROWTH_NUDGES_ENABLED` / `GROWTH_REPORT_WRITE` flags from `.env.example` are not set — all genuinely optional, not blocking anything.

## 4. Smoke after deploy — still open, needs a human pass

1. Sign up + confirm email
2. Complete talent + company profiles
3. Discover Skip (pink X) / Interested (blue check)
4. Company Board drag between stages
5. Settings → enable push (only after VAPID + `0025`)
6. Send a Hebrew message and confirm RTL

## 5. Explicitly not in this pilot build

- Full UI i18n / language switcher across the app
- Outlook calendar OAuth
- WhatsApp Business API (keep `wa.me`)
- Payments / native apps / admin panel
- Role-builder commute radius (talent commute already shipped)

## 6. Salary matching note

Match engine keeps `MATCH_WEIGHTS` unchanged. When both talent expectation and company/role budget exist, score gets a soft ±3 nudge (`lib/matching/salary-nudge.ts`). Change `SALARY_NUDGE_POINTS` if you want stronger/weaker effect — no weight table rewrite required.
