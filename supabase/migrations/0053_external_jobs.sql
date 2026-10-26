-- External Opportunities: AI job aggregation & auto-publishing engine.
-- See docs/EXTERNAL_JOBS.md.
--
-- Data is kept fully separate from company-managed jobs (public.roles):
-- nothing here references roles, role_applications, connections or the
-- relationship pipeline, and no candidate data is ever written to a source.
--
-- Engine tables (sources, runs, events, snapshots, takedowns, settings) have
-- RLS enabled with NO policies: only the service-role client used by the
-- cron and the admin dashboard can touch them. Candidates can read published
-- external_jobs rows and manage their own saves.

-- ---------------------------------------------------------------------------
-- Global switches (single row).
-- ---------------------------------------------------------------------------
create table if not exists public.external_jobs_settings (
  id boolean primary key default true check (id),
  crawling_enabled boolean not null default true,
  auto_publish_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

insert into public.external_jobs_settings (id) values (true)
on conflict (id) do nothing;

alter table public.external_jobs_settings enable row level security;

-- ---------------------------------------------------------------------------
-- Sources: one approved careers site / ATS board per row.
-- ---------------------------------------------------------------------------
create table if not exists public.external_job_sources (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  careers_url text not null,
  -- Which sanctioned collection method is used. Each maps to a connector in
  -- lib/external-jobs/connectors. There is deliberately no generic HTML
  -- scraper.
  source_type text not null check (source_type in (
    'greenhouse', 'lever', 'ashby', 'workable', 'smartrecruiters', 'jsonld_sitemap'
  )),
  -- Board token / account slug / sitemap URL, depending on source_type.
  source_key text not null,
  -- Legal basis the admin recorded when adding the source.
  collection_basis text not null check (collection_basis in (
    'public_api', 'public_feed', 'structured_data', 'written_permission'
  )),
  terms_reviewed_at timestamptz,
  terms_reviewed_by text,
  permission_notes text,
  -- Extra hosts (besides careers_url's) that apply links may point at.
  allowed_apply_hosts text[] not null default '{}',
  -- Domains whose owners may file a verified takedown for this source.
  company_domains text[] not null default '{}',
  -- Rule 3/4: never show a logo or a partnership claim unless recorded here.
  logo_url text,
  logo_permission boolean not null default false,
  is_official_partner boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'paused', 'removed')),
  publishing_paused boolean not null default false,
  publishing_paused_reason text,
  crawl_interval_hours int not null default 24 check (crawl_interval_hours >= 1),
  min_request_interval_ms int not null default 1500 check (min_request_interval_ms >= 250),
  robots_allowed boolean,
  robots_checked_at timestamptz,
  last_crawled_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  consecutive_failures int not null default 0,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, source_key)
);

create index if not exists external_job_sources_status_idx
  on public.external_job_sources (status, last_crawled_at);

alter table public.external_job_sources enable row level security;

drop trigger if exists set_external_job_sources_updated_at on public.external_job_sources;
create trigger set_external_job_sources_updated_at
  before update on public.external_job_sources
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- External jobs.
-- ---------------------------------------------------------------------------
create table if not exists public.external_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.external_job_sources (id) on delete cascade,
  -- The source's own job id; (source_id, external_id) is the natural key.
  external_id text not null,
  -- Cross-source duplicate key: normalized company + title + location.
  fingerprint text not null,
  -- Hash of the source content; a change triggers reprocessing.
  content_hash text not null,
  status text not null default 'discovered' check (status in (
    'discovered', 'pending_review', 'published', 'rejected', 'paused', 'expired', 'removed'
  )),
  status_reason text,
  company_name text not null,
  title text not null,
  location text,
  work_model text check (work_model is null or work_model in ('Remote', 'Hybrid', 'Office based')),
  employment_type text check (employment_type is null or employment_type in (
    'full_time', 'part_time', 'contract', 'freelance', 'internship', 'temporary'
  )),
  seniority text,
  department text,
  category text,
  source_language text,
  summary text,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  nice_to_have text[] not null default '{}',
  tags text[] not null default '{}',
  apply_url text not null,
  source_url text not null,
  -- Result of every mandatory check from the last validation run.
  validation jsonb not null default '[]'::jsonb,
  ai_model text,
  manually_edited boolean not null default false,
  source_posted_at timestamptz,
  source_updated_at timestamptz,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_verified_at timestamptz,
  verify_failures int not null default 0,
  processed_at timestamptz,
  published_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, external_id)
);

create index if not exists external_jobs_status_idx
  on public.external_jobs (status, published_at desc);
create index if not exists external_jobs_fingerprint_idx
  on public.external_jobs (fingerprint);
-- Hard guarantee against publishing the same job twice.
create unique index if not exists external_jobs_published_fingerprint_uniq
  on public.external_jobs (fingerprint)
  where status = 'published';

alter table public.external_jobs enable row level security;

drop policy if exists "anyone reads published external jobs" on public.external_jobs;
create policy "anyone reads published external jobs" on public.external_jobs
  for select using (status = 'published');

drop trigger if exists set_external_jobs_updated_at on public.external_jobs;
create trigger set_external_jobs_updated_at
  before update on public.external_jobs
  for each row execute function public.set_updated_at();

-- Source text kept for validation and admin side-by-side review only. Never
-- exposed to candidates (no policies).
create table if not exists public.external_job_snapshots (
  job_id uuid primary key references public.external_jobs (id) on delete cascade,
  source_text text not null,
  source_payload jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.external_job_snapshots enable row level security;

-- ---------------------------------------------------------------------------
-- Crawl runs, processing/audit log, engagement.
-- ---------------------------------------------------------------------------
create table if not exists public.external_crawl_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'cron',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb
);

alter table public.external_crawl_runs enable row level security;

create table if not exists public.external_job_events (
  id bigint generated always as identity primary key,
  job_id uuid references public.external_jobs (id) on delete cascade,
  source_id uuid references public.external_job_sources (id) on delete cascade,
  run_id uuid references public.external_crawl_runs (id) on delete set null,
  kind text not null,
  message text,
  detail jsonb,
  actor text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists external_job_events_job_idx
  on public.external_job_events (job_id, created_at desc);
create index if not exists external_job_events_created_idx
  on public.external_job_events (created_at desc);

alter table public.external_job_events enable row level security;

create table if not exists public.external_job_engagement (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.external_jobs (id) on delete cascade,
  kind text not null check (kind in ('view', 'apply_click', 'save')),
  user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists external_job_engagement_job_idx
  on public.external_job_engagement (job_id, kind);
create index if not exists external_job_engagement_created_idx
  on public.external_job_engagement (created_at desc);

alter table public.external_job_engagement enable row level security;

-- ---------------------------------------------------------------------------
-- Candidate favourites.
-- ---------------------------------------------------------------------------
create table if not exists public.external_job_saves (
  user_id uuid not null references public.users (id) on delete cascade,
  job_id uuid not null references public.external_jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

alter table public.external_job_saves enable row level security;

drop policy if exists "user manages own external job saves" on public.external_job_saves;
create policy "user manages own external job saves" on public.external_job_saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Company takedown requests.
-- ---------------------------------------------------------------------------
create table if not exists public.external_job_takedowns (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  requester_name text,
  requester_email text not null,
  job_id uuid references public.external_jobs (id) on delete set null,
  source_id uuid references public.external_job_sources (id) on delete set null,
  scope text not null default 'job' check (scope in ('job', 'company')),
  reason text,
  token_hash text not null,
  status text not null default 'pending_verification' check (status in (
    'pending_verification', 'needs_review', 'completed', 'rejected'
  )),
  verified_at timestamptz,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz not null default now()
);

create index if not exists external_job_takedowns_status_idx
  on public.external_job_takedowns (status, created_at desc);

alter table public.external_job_takedowns enable row level security;

-- ---------------------------------------------------------------------------
-- Company-managed open roles for the candidate Jobs page. Same
-- security-definer pattern as career_page_by_slug so roles RLS stays as is.
-- ---------------------------------------------------------------------------
create or replace function public.list_open_mingle_roles()
returns table (
  id uuid,
  title text,
  department text,
  employment_type text,
  work_model text,
  required_skills text[],
  company_name text,
  company_slug text,
  company_location text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    r.id,
    r.title,
    r.department,
    r.employment_type,
    r.work_model,
    r.required_skills,
    cp.company_name,
    cp.slug,
    cp.location,
    r.created_at
  from public.roles r
  join public.company_profiles cp on cp.user_id = r.company_id
  where r.status = 'open'
    and cp.slug is not null
    and not coalesce(cp.public_page_hidden, false)
  order by r.created_at desc
  limit 500;
$$;

grant execute on function public.list_open_mingle_roles() to authenticated;
