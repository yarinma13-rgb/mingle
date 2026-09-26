-- Stable anchor row for "this candidate x this role/company pairing", so
-- the pilot learning tables from 0024 (match_feature_snapshots, match_evidence,
-- interview_feedback, employment_outcomes — all keyed on a bare `match_id`
-- uuid with no real table behind it) have something real to reference, and
-- so the on-demand AI match explanation has something stable to cache
-- against. role_id is nullable: a company can be scored generically
-- (no specific open role) in some Discover contexts.

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles (id) on delete set null,
  company_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (company_id, candidate_id, role_id)
);

create index if not exists matches_company_idx on public.matches (company_id);
create index if not exists matches_candidate_idx on public.matches (candidate_id);
create index if not exists matches_role_idx on public.matches (role_id);

alter table public.matches enable row level security;

drop policy if exists "participants can read their own matches" on public.matches;
create policy "participants can read their own matches" on public.matches
  for select
  using (auth.uid() = company_id or auth.uid() = candidate_id);

-- Written only by server-side actions (service role / server actions using
-- the user's own session as company or candidate) — no public insert policy
-- beyond the participants themselves creating their own pairing on demand.
drop policy if exists "participants can create their own matches" on public.matches;
create policy "participants can create their own matches" on public.matches
  for insert
  with check (auth.uid() = company_id or auth.uid() = candidate_id);
