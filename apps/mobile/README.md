# mingle — mobile (Expo / React Native)

Native iOS + Android app for [mingle](https://mingle.careers). **Separate from the Next.js web app** in the repo root. Shares the same Supabase project (Auth, Postgres, Realtime).

## Stack

- Expo SDK 57 + Expo Router
- React Native
- Supabase JS (AsyncStorage session)
- Light / Dark theme toggle for all users

## Setup

```bash
cd apps/mobile
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run start
```

Then open in Expo Go, iOS simulator, Android emulator, or `npm run web`.

## Structure

- `app/(auth)` — welcome, path, sign-in / sign-up, onboarding
- `app/(talent)` — talent tabs (home, discover, connections, chat, more)
- `app/(company)` — company tabs (home, candidates, board, chat, more)
- `app/conversation/[id]` — chat + relationship stage tabs
- `src/` — theme, auth, supabase client, API helpers, UI kit

## Stores

No App Store / Play accounts yet — develop with Expo Go / internal builds first. Bundle IDs are reserved as `careers.mingle.app`.
