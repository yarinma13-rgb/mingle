# Google OAuth branding — stop showing `*.supabase.co`

Users currently see **"Continue to yehbilfmzjmdlthhbfgw.supabase.co"** on the Google sign-in screen. That host is the Supabase project ref. It looks untrustworthy and is unrelated to mingle branding.

`redirectTo` in app code (`/auth/callback`) does **not** control this line. Google shows the **OAuth callback host** registered for the provider (Supabase Auth URL).

---

## Fix (required ops — cannot be done from git alone)

Do **both** A and B. A removes the scary hostname; B shows the mingle brand name.

### A. Supabase custom domain (recommended by Supabase)

1. Supabase Dashboard → **Settings → Custom Domains**
2. Add e.g. `auth.mingle.careers` (or `api.mingle.careers`)
3. Complete DNS (CNAME) and **activate** the domain
4. Google Cloud Console → OAuth client → **Authorized redirect URIs** — add:
   - `https://auth.mingle.careers/auth/v1/callback`
   - keep existing `https://yehbilfmzjmdlthhbfgw.supabase.co/auth/v1/callback`
5. Vercel / `.env` — set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://auth.mingle.careers
   ```
   (anon key stays the same)
6. Supabase Auth → URL configuration — Site URL = `https://mingle.careers`, add redirect allow-list for app callbacks

After activation, Google should show **"Continue to auth.mingle.careers"** (or your chosen host) instead of the random supabase ref.

Docs: https://supabase.com/docs/guides/platform/custom-domains  
Google auth note: https://supabase.com/docs/guides/auth/social-login/auth-google

### B. Google Auth Platform branding

1. [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding)
2. App name: **mingle** (or mingle.careers)
3. Logo, homepage `https://mingle.careers`, privacy + terms links
4. Verify domain `mingle.careers` (Search Console)
5. Publish the OAuth app (leave Testing only if you must — branding is unreliable in Testing)
6. Submit brand verification if Google requires it (can take days)

With branding verified, Google can show the **app name** more clearly alongside the domain.

---

## What the app already does

- Google button uses `signInWithOAuth` with `redirectTo: {origin}/auth/callback?path=…`
- Clients read `NEXT_PUBLIC_SUPABASE_URL` — once you point it at the custom domain, Auth uses that host

## Checklist

- [ ] Custom domain activated on Supabase
- [ ] Google redirect URI updated for custom domain
- [ ] `NEXT_PUBLIC_SUPABASE_URL` updated in Vercel production + preview
- [ ] Google branding published / verified
- [ ] Manual test: Incognito → Continue with Google → confirm host is **not** `*.supabase.co`
