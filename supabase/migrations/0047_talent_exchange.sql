-- Post-rejection talent discovery: a candidate declined by one company can
-- opt into being discoverable to OTHER companies for OTHER open roles.
-- Three tables: candidate_visibility (the opt-in choice), visibility_audit_log
-- (every change to it, never silent), talent_exchange_interest (the
-- company-interested / candidate-interested / mutual state machine, keyed
-- off the existing matches anchor from 0042 so it's already scoped per
-- candidate x role x company and already has team-workspace-aware RLS
-- helpers to reuse).

create table if not exists public.candidate_visibility (
  candidate_id uuid primary key references public.users (id) on delete cascade,
  status text not null default 'private'
    check (status in ('private', 'discoverable', 'open_to_opportunities')),
  updated_at timestamptz not null default now()
);

alter table public.candidate_visibility enable row level security;

drop policy if exists "candidate manages own visibility" on public.candidate_visibility;
create policy "candidate manages own visibility" on public.candidate_visibility
  for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

-- Companies may discover candidates who opted in — never 'private' rows.
drop policy if exists "companies read discoverable visibility" on public.candidate_visibility;
create policy "companies read discoverable visibility" on public.candidate_visibility
  for select
  using (
    status in ('discoverable', 'open_to_opportunities')
    and exists (
      select 1 from public.users
      where id = auth.uid() and user_type = 'company'
    )
  );

drop trigger if exists set_candidate_visibility_updated_at on public.candidate_visibility;
create trigger set_candidate_visibility_updated_at
  before update on public.candidate_visibility
  for each row execute function public.set_updated_at();

create table if not exists public.visibility_audit_log (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users (id) on delete cascade,
  previous_status text,
  new_status text not null,
  source text not null check (source in ('post_rejection_flow', 'privacy_settings')),
  consent_version text not null default 'v1',
  created_at timestamptz not null default now()
);

create index if not exists visibility_audit_log_candidate_idx
  on public.visibility_audit_log (candidate_id, created_at desc);

alter table public.visibility_audit_log enable row level security;

drop policy if exists "candidate reads own visibility audit" on public.visibility_audit_log;
create policy "candidate reads own visibility audit" on public.visibility_audit_log
  for select
  using (auth.uid() = candidate_id);

-- Written only by the server-side setCandidateVisibility() action, using
-- the candidate's own session.
drop policy if exists "candidate writes own visibility audit" on public.visibility_audit_log;
create policy "candidate writes own visibility audit" on public.visibility_audit_log
  for insert
  with check (auth.uid() = candidate_id);

create table if not exists public.talent_exchange_interest (
  match_id uuid primary key references public.matches (id) on delete cascade,
  company_interested boolean not null default false,
  candidate_interested boolean,
  status text not null default 'pending'
    check (status in ('pending', 'mutual', 'candidate_declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.talent_exchange_interest enable row level security;

-- Reuses is_match_participant()/matches from 0042 for scoping: anyone on
-- either side of the underlying match (company owner, active company
-- member, or the candidate) can read/write.
drop policy if exists "match participants manage talent exchange interest" on public.talent_exchange_interest;
create policy "match participants manage talent exchange interest" on public.talent_exchange_interest
  for all
  using (
    exists (
      select 1 from public.matches m
      where m.id = talent_exchange_interest.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  )
  with check (
    exists (
      select 1 from public.matches m
      where m.id = talent_exchange_interest.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );

drop trigger if exists set_talent_exchange_interest_updated_at on public.talent_exchange_interest;
create trigger set_talent_exchange_interest_updated_at
  before update on public.talent_exchange_interest
  for each row execute function public.set_updated_at();
