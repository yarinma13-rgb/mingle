-- Schema-only placeholders so pilot outcomes can land without a rewrite.
-- Empty except one model_versions row. No app writes, no Match Report wiring.

create table if not exists public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  version text not null unique,
  embedding_model text,
  ranking_model text,
  feature_version text,
  weights_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.model_versions (
  model_name,
  version,
  ranking_model,
  feature_version,
  weights_json
)
values (
  'heuristic-overlap',
  'v1-heuristic-overlap',
  'weighted-overlap',
  'profile-signals-v1',
  '{
    "careerGoals": 20,
    "motivations": 20,
    "workStyle": 18,
    "industry": 14,
    "experience": 13,
    "location": 8,
    "companyStage": 7
  }'::jsonb
)
on conflict (version) do nothing;

create table if not exists public.match_feature_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  features_json jsonb not null default '{}'::jsonb,
  model_version text,
  created_at timestamptz not null default now()
);

create index if not exists match_feature_snapshots_match_idx
  on public.match_feature_snapshots (match_id);

create table if not exists public.match_evidence (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  feature text,
  evidence_type text,
  source text,
  source_reference text,
  candidate_value text,
  company_value text,
  contribution numeric,
  confidence text,
  created_at timestamptz not null default now()
);

create index if not exists match_evidence_match_idx
  on public.match_evidence (match_id);

create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  interviewer_id uuid references public.users (id) on delete set null,
  technical_fit int,
  role_fit int,
  team_fit int,
  motivation_fit int,
  recommendation text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists interview_feedback_match_idx
  on public.interview_feedback (match_id);

create table if not exists public.employment_outcomes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  hire_date date,
  day_30_status text,
  day_30_feedback text,
  day_90_status text,
  day_90_feedback text,
  retained boolean,
  satisfaction_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employment_outcomes_match_idx
  on public.employment_outcomes (match_id);

alter table public.model_versions enable row level security;
alter table public.match_feature_snapshots enable row level security;
alter table public.match_evidence enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.employment_outcomes enable row level security;

drop trigger if exists set_employment_outcomes_updated_at on public.employment_outcomes;
create trigger set_employment_outcomes_updated_at
  before update on public.employment_outcomes
  for each row execute function public.set_updated_at();
