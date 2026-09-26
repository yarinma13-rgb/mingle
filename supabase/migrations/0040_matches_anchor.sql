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

-- Shared by every match-related RLS policy below (0040-0043): "company
-- side" includes active company_members, same team-workspace model as
-- candidate_notes (0036) — a team member acting on the board needs the
-- same access as the workspace owner, not just auth.uid() = company_id.
create or replace function public.is_match_participant(
  m_company_id uuid,
  m_candidate_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = m_company_id
    or auth.uid() = m_candidate_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = m_company_id
        and status = 'active'
        and user_id is not null
    );
$$;

-- Company side only (workspace owner or active member) — no candidate.
create or replace function public.is_match_company_side(
  m_company_id uuid
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() = m_company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = m_company_id
        and status = 'active'
        and user_id is not null
    );
$$;

drop policy if exists "participants can read their own matches" on public.matches;
create policy "participants can read their own matches" on public.matches
  for select
  using (public.is_match_participant(company_id, candidate_id));

-- Written only by server-side actions (service role / server actions using
-- the user's own session as company, an active company member, or candidate).
drop policy if exists "participants can create their own matches" on public.matches;
create policy "participants can create their own matches" on public.matches
  for insert
  with check (public.is_match_participant(company_id, candidate_id));
