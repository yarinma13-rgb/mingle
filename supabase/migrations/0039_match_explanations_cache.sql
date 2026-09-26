-- Cache for the on-demand AI match explanation (WHY / WHY NOT / WHAT TO
-- VALIDATE / RECOMMENDED NEXT STEP). Keyed by match_id + a hash of the
-- exact structured inputs the explanation was built from, so re-opening
-- the same pair with unchanged profile/role data is a cache hit and never
-- re-calls the LLM. A new input_hash (profile or role changed) naturally
-- produces a cache miss rather than needing an explicit invalidation step.

create table if not exists public.match_explanations (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  input_hash text not null,
  intelligence_json jsonb not null,
  model_version text not null,
  created_at timestamptz not null default now(),
  unique (match_id, input_hash)
);

create index if not exists match_explanations_match_idx
  on public.match_explanations (match_id);

alter table public.match_explanations enable row level security;

drop policy if exists "participants can read match explanations" on public.match_explanations;
create policy "participants can read match explanations" on public.match_explanations
  for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_explanations.match_id
        and (auth.uid() = m.company_id or auth.uid() = m.candidate_id)
    )
  );

drop policy if exists "participants can write match explanations" on public.match_explanations;
create policy "participants can write match explanations" on public.match_explanations
  for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_explanations.match_id
        and (auth.uid() = m.company_id or auth.uid() = m.candidate_id)
    )
  );
