-- Optional GitHub URL + cached public metadata for soft technical signal.
-- Does not affect Role Fit axis averages; used as a separate match-report line.

alter table public.talent_profiles
  add column if not exists github_url text;

alter table public.talent_profiles
  add column if not exists github_login text;

alter table public.talent_profiles
  add column if not exists github_meta jsonb;

alter table public.talent_profiles
  add column if not exists github_fetched_at timestamptz;
