# Pilot ops checklist — mingle

Code on `main` already covers the product UX closeout. What is left is **founder ops**. Do these in order.

## 1. Supabase SQL (SQL Editor)

Run any not-yet-applied migrations from `supabase/migrations/` in order, especially:

- `0011` … `0030` (push, roles, salary, commute, calendar, GitHub signal, rediscovery, etc.)

If a migration errors as "already exists", skip and continue.

## 2. Supabase Auth

- Enable **email confirmation**
- Confirm URL template:
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup`

## 3. Vercel env (production)

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
| `GITHUB_TOKEN` | Optional GitHub rate limits |
| `ADMIN_EMAILS` | Admin / founder inbox fallback |

Generate VAPID once:

```bash
npx web-push generate-vapid-keys
```

Redeploy after saving env.

## 4. Smoke after deploy

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
