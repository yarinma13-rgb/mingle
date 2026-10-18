-- Public "Book a demo" submissions from /contact. Written only by the server
-- action (service role); RLS is on with no policies so anon/authenticated
-- clients can neither read nor write leads directly.

create table if not exists public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  work_email text not null,
  job_title text,
  company_name text not null,
  company_size text not null,
  explore text not null,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  status text not null default 'new'
);

create index if not exists demo_requests_created_at_idx
  on public.demo_requests (created_at desc);
create index if not exists demo_requests_email_created_idx
  on public.demo_requests (lower(work_email), created_at desc);

alter table public.demo_requests enable row level security;
