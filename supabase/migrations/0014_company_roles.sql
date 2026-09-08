-- MINGLE — company role / job builder (handoff 6.1).
-- Owner-only RLS, matching company_profiles write access. Candidates do
-- not read this table yet; Discover exposure is a later decision.
-- salary_min / salary_max are schema-only for 6.3 and must not be shown
-- in any UI until that work lands.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  department text,
  seniority text,
  employment_type text
    check (employment_type is null or employment_type in (
      'full_time', 'part_time', 'contract', 'freelance'
    )),
  work_model text
    check (work_model is null or work_model in (
      'Remote', 'Hybrid', 'Office based'
    )),
  required_skills text[] not null default '{}',
  description text,
  status text not null default 'open'
    check (status in ('open', 'paused', 'closed')),
  salary_min int,
  salary_max int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roles_company_id_idx on public.roles (company_id);
create index if not exists roles_company_status_idx on public.roles (company_id, status);

alter table public.roles enable row level security;

drop policy if exists "company manage own roles" on public.roles;
create policy "company manage own roles" on public.roles
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();
