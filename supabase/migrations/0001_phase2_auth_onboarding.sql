-- MINGLE — Phase 2: auth + onboarding schema
-- PRODUCT_SPEC.md section 6 (users, talent_preferences, company_preferences)
-- and section 7 (RLS: users can only access/edit their own data).

-- ── users ──────────────────────────────────────────────────────────
-- Mirrors auth.users 1:1. onboarding_step is a small addition beyond the
-- spec's literal field list, needed to satisfy section 56's resume-from-
-- last-step requirement without overloading onboarding_status.
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  user_type text not null check (user_type in ('talent', 'company')),
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  onboarding_step int not null default 1,
  profile_completion int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- ── talent_preferences ────────────────────────────────────────────
-- Q1 (single-select): what are you looking for right now
-- Q2 (multi-select): what matters most in your next move
-- Q3 (multi-select): what type of companies interest you
create table if not exists public.talent_preferences (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null unique references public.users (id) on delete cascade,
  career_goals text,
  motivations text[] not null default '{}',
  company_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── company_preferences ───────────────────────────────────────────
-- Q1 (single-select): what are you looking to connect about
-- Q2 (multi-select): what matters most when meeting great talent
-- Q3 (multi-select): what type of talent are you interested in
create table if not exists public.company_preferences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.users (id) on delete cascade,
  hiring_needs text,
  culture_priorities text[] not null default '{}',
  talent_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── row level security ────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.talent_preferences enable row level security;
alter table public.company_preferences enable row level security;

create policy "users select own row" on public.users
  for select using (auth.uid() = id);
create policy "users update own row" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own row" on public.users
  for insert with check (auth.uid() = id);

create policy "talent manage own preferences" on public.talent_preferences
  for all using (auth.uid() = talent_id) with check (auth.uid() = talent_id);

create policy "company manage own preferences" on public.company_preferences
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

-- ── updated_at maintenance ────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_talent_preferences_updated_at
  before update on public.talent_preferences
  for each row execute function public.set_updated_at();

create trigger set_company_preferences_updated_at
  before update on public.company_preferences
  for each row execute function public.set_updated_at();

-- ── auto-create public.users row on signup ────────────────────────
-- user_type comes from signUp's options.data for email/password; for
-- Google OAuth (no custom metadata available at this point) it defaults
-- to 'talent' here and the app corrects it right after auth in
-- /auth/callback, using the path carried through the OAuth redirect URL.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'user_type', 'talent')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
