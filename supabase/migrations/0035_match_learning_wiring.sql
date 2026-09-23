-- Wire recruiting-intelligence learning tables for real writes.
-- Extends 0024 placeholders with party ids, RLS, and model version row.

alter table public.match_feature_snapshots
  add column if not exists company_id uuid references public.users (id) on delete set null,
  add column if not exists talent_id uuid references public.users (id) on delete set null,
  add column if not exists role_id uuid references public.roles (id) on delete set null,
  add column if not exists audience text;

create index if not exists match_feature_snapshots_company_idx
  on public.match_feature_snapshots (company_id, created_at desc);
create index if not exists match_feature_snapshots_talent_idx
  on public.match_feature_snapshots (talent_id, created_at desc);

alter table public.match_evidence
  add column if not exists company_id uuid references public.users (id) on delete set null,
  add column if not exists talent_id uuid references public.users (id) on delete set null;

alter table public.interview_feedback
  add column if not exists company_id uuid references public.users (id) on delete set null,
  add column if not exists talent_id uuid references public.users (id) on delete set null,
  add column if not exists interview_id uuid references public.interviews (id) on delete set null;

alter table public.employment_outcomes
  add column if not exists company_id uuid references public.users (id) on delete set null,
  add column if not exists talent_id uuid references public.users (id) on delete set null,
  add column if not exists role_id uuid references public.roles (id) on delete set null;

insert into public.model_versions (
  model_name,
  version,
  ranking_model,
  feature_version,
  weights_json
)
values (
  'heuristic-overlap-intelligence',
  'v1-heuristic-overlap-intelligence',
  'weighted-overlap+adjacency',
  'intelligence-v1',
  '{
    "careerGoals": 17,
    "motivations": 17,
    "workStyle": 15,
    "industry": 12,
    "experience": 11,
    "skills": 16,
    "location": 7,
    "companyStage": 5
  }'::jsonb
)
on conflict (version) do nothing;

-- Company (or team member acting as company owner) can write/read own learning rows.
drop policy if exists "company insert match feature snapshots" on public.match_feature_snapshots;
create policy "company insert match feature snapshots" on public.match_feature_snapshots
  for insert to authenticated
  with check (company_id = auth.uid() or talent_id = auth.uid());

drop policy if exists "party read match feature snapshots" on public.match_feature_snapshots;
create policy "party read match feature snapshots" on public.match_feature_snapshots
  for select to authenticated
  using (company_id = auth.uid() or talent_id = auth.uid());

drop policy if exists "company insert match evidence" on public.match_evidence;
create policy "company insert match evidence" on public.match_evidence
  for insert to authenticated
  with check (company_id = auth.uid() or talent_id = auth.uid());

drop policy if exists "party read match evidence" on public.match_evidence;
create policy "party read match evidence" on public.match_evidence
  for select to authenticated
  using (company_id = auth.uid() or talent_id = auth.uid());

drop policy if exists "company manage interview feedback" on public.interview_feedback;
create policy "company manage interview feedback" on public.interview_feedback
  for all to authenticated
  using (company_id = auth.uid() or interviewer_id = auth.uid())
  with check (company_id = auth.uid() or interviewer_id = auth.uid());

drop policy if exists "company manage employment outcomes" on public.employment_outcomes;
create policy "company manage employment outcomes" on public.employment_outcomes
  for all to authenticated
  using (company_id = auth.uid())
  with check (company_id = auth.uid());
