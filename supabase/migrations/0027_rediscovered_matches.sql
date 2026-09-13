-- Candidate rediscovery: warm prior signals re-scored for a newly opened role.

create table if not exists public.rediscovered_matches (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  prior_signal text not null
    check (prior_signal in ('interested', 'mutual', 'in_conversation')),
  prior_role_id uuid references public.roles (id) on delete set null,
  prior_role_title text,
  prior_at timestamptz,
  score int,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);

create index if not exists rediscovered_matches_company_idx
  on public.rediscovered_matches (company_id);
create index if not exists rediscovered_matches_role_idx
  on public.rediscovered_matches (role_id);
create index if not exists rediscovered_matches_candidate_idx
  on public.rediscovered_matches (candidate_id);

alter table public.rediscovered_matches enable row level security;

drop policy if exists "company manage rediscovered matches" on public.rediscovered_matches;
create policy "company manage rediscovered matches"
  on public.rediscovered_matches
  for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "talent read own rediscovered matches" on public.rediscovered_matches;
create policy "talent read own rediscovered matches"
  on public.rediscovered_matches
  for select
  using (auth.uid() = candidate_id);
