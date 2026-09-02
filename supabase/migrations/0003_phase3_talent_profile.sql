-- MINGLE — Phase 3: talent profile creation
-- PRODUCT_SPEC.md section 6 (talent_profiles) and sections 22-28
-- (basic profile, what drives you, how you work, what you're looking
-- for, beyond the CV, profile preview).
--
-- drives / work_style / looking_for / beyond_cv are additions beyond
-- section 6's literal field list — the spec's talent_profiles columns
-- cover identity/basic info only, with no dedicated columns for the
-- three deep profile-building questions, so they're added here
-- alongside the section-6 fields rather than overloading
-- talent_preferences (which already holds the separate, earlier
-- onboarding-question answers from Phase 2).

create table if not exists public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  first_name text,
  last_name text,
  headline text,
  location text,
  profile_photo text,
  years_experience int,
  current_job_title text,
  industry text,
  drives text[] not null default '{}',
  work_style text[] not null default '{}',
  looking_for text[] not null default '{}',
  beyond_cv text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.talent_profiles enable row level security;

drop policy if exists "talent manage own profile" on public.talent_profiles;
create policy "talent manage own profile" on public.talent_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_talent_profiles_updated_at on public.talent_profiles;
create trigger set_talent_profiles_updated_at
  before update on public.talent_profiles
  for each row execute function public.set_updated_at();
