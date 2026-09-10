-- Admin match review + audit log. App-level email allow-list gates the UI.
-- Authenticated writes are allowed so the allow-listed user can record a decision.

create table if not exists public.match_reviews (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  job_title text,
  company_name text,
  candidate_name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'flagged')),
  note text,
  overall int,
  role_fit int,
  company_fit int,
  motivation_fit int,
  confidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);

create index if not exists match_reviews_company_idx on public.match_reviews (company_id);
create index if not exists match_reviews_status_idx on public.match_reviews (status);

create table if not exists public.match_review_audit (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.match_reviews (id) on delete cascade,
  actor_id uuid not null references public.users (id) on delete cascade,
  actor_email text,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.match_reviews enable row level security;
alter table public.match_review_audit enable row level security;

drop policy if exists "authenticated manage match reviews" on public.match_reviews;
create policy "authenticated manage match reviews" on public.match_reviews
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "authenticated manage match review audit" on public.match_review_audit;
create policy "authenticated manage match review audit" on public.match_review_audit
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop trigger if exists set_match_reviews_updated_at on public.match_reviews;
create trigger set_match_reviews_updated_at
  before update on public.match_reviews
  for each row execute function public.set_updated_at();
