-- MINGLE — Phase 4: company profile creation, and cross-side profile
-- visibility for the profile-viewing screens (PRODUCT_SPEC.md section
-- 6 company_profiles, section 13, sections 21 and 43-44).
--
-- who_thrives_here and looking_for are additions beyond section 6's
-- literal field list, mirroring the same pattern used for talent's
-- deeper profile-building questions in Phase 3 — kept alongside the
-- section-6 fields rather than overloading company_preferences (which
-- already holds the separate, earlier onboarding answers from Phase 2).
--
-- Cross-visibility: profiles must be readable by the opposite user
-- type for discovery and the profile-viewing screens to work at all.
-- This adds authenticated-read policies without touching the existing
-- owner-only write policies. Phase 5's real matching/discovery design
-- may want to narrow this further (e.g. only after a connection); this
-- is the correct minimum for Phase 4's viewing screens to function.

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  company_name text,
  logo text,
  mission text,
  industry text,
  company_stage text,
  company_size text,
  location text,
  work_environment text[] not null default '{}',
  values text[] not null default '{}',
  who_thrives_here text,
  description text,
  looking_for text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_profiles enable row level security;

drop policy if exists "company manage own profile" on public.company_profiles;
create policy "company manage own profile" on public.company_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "authenticated can view company profiles" on public.company_profiles;
create policy "authenticated can view company profiles" on public.company_profiles
  for select using (auth.role() = 'authenticated');

drop trigger if exists set_company_profiles_updated_at on public.company_profiles;
create trigger set_company_profiles_updated_at
  before update on public.company_profiles
  for each row execute function public.set_updated_at();

-- talent_profiles already has owner-only "for all" access from Phase 3;
-- add a parallel authenticated-read policy so companies can view talent
-- profiles the same way.
drop policy if exists "authenticated can view talent profiles" on public.talent_profiles;
create policy "authenticated can view talent profiles" on public.talent_profiles
  for select using (auth.role() = 'authenticated');

-- users rows themselves (name-adjacent fields live on the profile
-- tables, but user_type/email are read during profile viewing too).
drop policy if exists "authenticated can view users" on public.users;
create policy "authenticated can view users" on public.users
  for select using (auth.role() = 'authenticated');
