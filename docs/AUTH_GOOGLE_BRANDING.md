# Google OAuth branding — stop showing `*.supabase.co`

**Status: fixed for free, without the paid path below.** "Continue with Google"
no longer redirects through Supabase's auth host at all — see "What the app
does now" further down. Options A/B below (Supabase custom domain, ~$35/mo)
were the original plan and are kept here in case the free approach ever needs
to be revisited, but they are **not** currently needed for this specific
problem.

---

Users used to see **"Continue to yehbilfmzjmdlthhbfgw.supabase.co"** on the Google sign-in screen. That host is the Supabase project ref. It looks untrustworthy and is unrelated to mingle branding.

App `redirectTo` (`/auth/callback`) does **not** control this line. Google shows the **OAuth callback host** — the Supabase Auth URL from `NEXT_PUBLIC_SUPABASE_URL`.

---

## Fix (ops — dashboards only)

Do **both** A and B.

### A. Supabase custom domain

1. Supabase Dashboard → **Settings → Custom Domains**
2. Add e.g. `auth.mingle.careers`
3. Complete DNS (CNAME) and **activate** the domain  
   Docs: https://supabase.com/docs/guides/platform/custom-domains
4. Google Cloud Console → OAuth client → **Authorized redirect URIs** — add:
   - `https://auth.mingle.careers/auth/v1/callback`
   - keep existing `https://yehbilfmzjmdlthhbfgw.supabase.co/auth/v1/callback` until cutover is verified
5. Vercel → Production (and Preview) env:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://auth.mingle.careers
   ```
   Anon key stays the same. Redeploy after saving.
6. Supabase Auth → URL configuration:
   - Site URL = `https://mingle.careers`
   - Redirect allow-list includes `https://mingle.careers/auth/callback` (and local if needed)

After activation, Google should show **"Continue to auth.mingle.careers"** instead of the random supabase ref.

### B. Google Auth Platform branding

1. [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding)
2. App name: **mingle**
3. Logo, homepage `https://mingle.careers`, privacy + terms links
4. Verify domain `mingle.careers` (Search Console)
5. Publish the OAuth app (not Testing-only if you want stable branding)
6. Submit brand verification if Google requires it (can take days)

---

## What the app does now (the actual fix, $0/month)

"Continue with Google" no longer uses `supabase.auth.signInWithOAuth` (which
always redirects through the Supabase Auth host — that's what showed
`*.supabase.co`). Instead:

1. `components/AuthForm.tsx` loads Google Identity Services
   (`https://accounts.google.com/gsi/client`) and opens a **Google-hosted
   popup** via `google.accounts.oauth2.initCodeClient({ ux_mode: "popup" })`.
   The popup's origin is `mingle.careers` (an already-Authorized JavaScript
   origin on the OAuth client) — Supabase is never involved in anything the
   user sees.
2. The popup returns an authorization `code` to the page (no navigation, no
   redirect at all).
3. The code is POSTed to `app/api/auth/google/login-exchange/route.ts`, which
   exchanges it server-side for a Google ID token (`GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`, already-existing env vars — reused from the
   calendar-connect flow, no new secret needed).
4. The browser calls `supabase.auth.signInWithIdToken({ provider: "google",
   token })` with that ID token — this establishes the Supabase session
   without any redirect through Supabase's own host either.
5. `AuthForm.tsx` then replicates what `app/auth/callback/route.ts` used to
   do server-side (resolve `user_type`, block personal emails on the company
   track, stamp metadata, call `destinationAfterAuth`) — same rules, just
   client-side now.

New env var: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same value as `GOOGLE_CLIENT_ID`,
just exposed to the browser — client IDs aren't secret). No Google Cloud
Console changes were needed — the popup code-exchange flow uses Google's
reserved `redirect_uri: "postmessage"` value, which needs no entry in
Authorized redirect URIs, and the existing Authorized JavaScript origins
(`https://mingle.careers`, `http://localhost:3000`) already covered it.

The old `/auth/callback?code=...` path (`app/auth/callback/route.ts`) is
untouched and still used for password-reset links and any other flow that
still exchanges a Supabase code server-side — this change only affects the
Google button.

## Checklist (for the free fix above)

- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` added to Vercel (Production + Preview) — same value as `GOOGLE_CLIENT_ID`
- [ ] Manual test: Incognito → Continue with Google → popup shows **mingle.careers**, not `*.supabase.co`
- [ ] Manual test: new talent signup, new company signup (work email), existing user sign-in — all still land on the right destination
- [ ] Manual test: personal email + company path still gets blocked with the same message as before
