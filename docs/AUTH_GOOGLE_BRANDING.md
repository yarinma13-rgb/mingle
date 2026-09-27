# Google OAuth branding — stop showing `*.supabase.co`

Users currently see **"Continue to yehbilfmzjmdlthhbfgw.supabase.co"** on the Google sign-in screen. That host is the Supabase project ref. It looks untrustworthy and is unrelated to mingle branding.

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

## What the app already does

- Google button uses `signInWithOAuth` with `redirectTo: {origin}/auth/callback?path=…`
- Clients read `NEXT_PUBLIC_SUPABASE_URL` — once pointed at the custom domain, Auth uses that host

## Checklist

- [ ] Custom domain activated on Supabase
- [ ] Google redirect URI updated for custom domain
- [ ] `NEXT_PUBLIC_SUPABASE_URL` updated in Vercel + redeploy
- [ ] Google branding published / verified
- [ ] Manual test: Incognito → Continue with Google → host is **not** `*.supabase.co`
