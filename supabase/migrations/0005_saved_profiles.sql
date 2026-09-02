-- MINGLE — Phase 5: saved profiles for Discovery (PRODUCT_SPEC.md
-- sections 29-34 and 43-49, "Saved profiles: save / remove / view
-- saved, persisted").
--
-- Owner-only: a user can only see and manage their own saved list.
-- saved_user_id is not FK-scoped to a single profile table since it
-- can point at either a talent_profiles.user_id or a
-- company_profiles.user_id depending on who's doing the saving; it is
-- still constrained to a real users row.

create table if not exists public.saved_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  saved_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, saved_user_id)
);

alter table public.saved_profiles enable row level security;

drop policy if exists "manage own saved profiles" on public.saved_profiles;
create policy "manage own saved profiles" on public.saved_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
