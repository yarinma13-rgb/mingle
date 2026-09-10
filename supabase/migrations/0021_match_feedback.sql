-- Recruiter/talent Interested and Not a fit (PRD sections 23–24).
-- One row per actor + target so a later tap can change the last action.

create table if not exists public.match_feedback (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users (id) on delete cascade,
  target_user_id uuid not null references public.users (id) on delete cascade,
  action text not null check (action in ('interested', 'not_fit')),
  reason text,
  free_text text,
  created_at timestamptz not null default now(),
  unique (actor_id, target_user_id)
);

alter table public.match_feedback enable row level security;

drop policy if exists "manage own match feedback" on public.match_feedback;
create policy "manage own match feedback" on public.match_feedback
  for all using (auth.uid() = actor_id) with check (auth.uid() = actor_id);
