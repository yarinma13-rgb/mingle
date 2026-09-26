-- Match collaborators: invite a specific teammate to weigh in on a
-- specific candidate match, and track their tone + comment. Narrower
-- than the workspace-wide RLS transparency (0035) — this is about
-- *tracking who has weighed in on this match*, not visibility.

create table if not exists public.match_collaborators (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  invited_user_id uuid not null references public.users (id) on delete cascade,
  invited_by uuid not null references public.users (id) on delete cascade,
  tone text check (tone in ('positive', 'neutral', 'concern')),
  comment text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (connection_id, invited_user_id)
);

create index if not exists match_collaborators_connection_id_idx
  on public.match_collaborators (connection_id);

alter table public.match_collaborators enable row level security;

drop policy if exists "team workspace manages match collaborators" on public.match_collaborators;
create policy "team workspace manages match collaborators" on public.match_collaborators
  for all
  using (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = match_collaborators.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = match_collaborators.company_id
        and status = 'active'
        and user_id is not null
    )
  );
