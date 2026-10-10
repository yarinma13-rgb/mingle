-- Soft account deletion with a 14-day grace window.
-- During grace, signing in again clears these fields and restores access.
-- After deletion_scheduled_for, a cron / privileged job hard-deletes auth.users
-- (cascades to public.users) which also removes Google/Gmail identities.

alter table public.users
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_scheduled_for timestamptz;

create index if not exists users_deletion_scheduled_for_idx
  on public.users (deletion_scheduled_for)
  where deletion_scheduled_for is not null;

comment on column public.users.deletion_requested_at is
  'When the user scheduled account deletion. Null = active.';
comment on column public.users.deletion_scheduled_for is
  'Hard-delete after this timestamp (typically requested_at + 14 days).';
