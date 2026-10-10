-- Growth nudge dedupe log. Before this, run-nudges.ts only deduped within a
-- single run (a comment there said "not a full dedupe store yet") — the same
-- user could get re-nudged every time the job ran. This table lets the runner
-- check "did we already send this nudge_type to this user recently?" across
-- runs, so nudges can move to their own frequent schedule without spamming.

create table if not exists public.growth_nudge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nudge_type text not null,
  sent_at timestamptz not null default now()
);

create index if not exists growth_nudge_log_user_type_idx
  on public.growth_nudge_log (user_id, nudge_type, sent_at desc);

alter table public.growth_nudge_log enable row level security;

-- No anon/authenticated policies: only service role (the nudge cron) reads/writes.
comment on table public.growth_nudge_log is
  'Growth nudge send log for dedupe. Service-role only.';
