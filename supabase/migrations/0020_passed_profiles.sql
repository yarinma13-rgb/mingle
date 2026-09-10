-- Passed Discover profiles (handoff 2026-09-09 B2). Owner-only list so
-- swipe-left / Skip can be undone from a real revisitable list.

create table if not exists public.passed_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  passed_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, passed_user_id)
);

alter table public.passed_profiles enable row level security;

drop policy if exists "manage own passed profiles" on public.passed_profiles;
create policy "manage own passed profiles" on public.passed_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
