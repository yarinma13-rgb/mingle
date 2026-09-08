-- MINGLE — company team invites and internal interview scheduling (handoff 6.4 v1).
-- No Google/Outlook columns. External calendar sync stays blocked.

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  email text not null,
  user_id uuid references public.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'hr', 'team_lead', 'member')),
  status text not null default 'invited'
    check (status in ('invited', 'active')),
  invited_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

alter table public.company_members enable row level security;

drop policy if exists "company owner manages members" on public.company_members;
create policy "company owner manages members" on public.company_members
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

drop policy if exists "invitee claims own invite" on public.company_members;
create policy "invitee claims own invite" on public.company_members
  for update
  using (
    status = 'invited'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  )
  with check (
    user_id = auth.uid()
    and status = 'active'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  );

drop policy if exists "member reads own membership" on public.company_members;
create policy "member reads own membership" on public.company_members
  for select using (user_id = auth.uid() or company_id = auth.uid());

drop policy if exists "invitee reads own invite" on public.company_members;
create policy "invitee reads own invite" on public.company_members
  for select using (
    status = 'invited'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  );

create or replace function public.pending_company_invite()
returns table (
  id uuid,
  company_id uuid,
  company_name text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.company_id,
    coalesce(nullif(trim(cp.company_name), ''), 'a mingle company'),
    m.role
  from public.company_members m
  left join public.company_profiles cp on cp.user_id = m.company_id
  join public.users u on u.id = auth.uid()
  where m.status = 'invited'
    and lower(m.email) = lower(u.email)
  limit 1
$$;

create or replace function public.claim_company_invite()
returns table (
  company_id uuid,
  company_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.company_members%rowtype;
  actor uuid := auth.uid();
  actor_email text;
begin
  if actor is null then
    raise exception 'not signed in';
  end if;

  select email into actor_email from public.users where id = actor;
  if actor_email is null then
    raise exception 'no user row';
  end if;

  select * into invite
  from public.company_members
  where status = 'invited'
    and lower(email) = lower(actor_email)
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'no invite';
  end if;

  update public.company_members
  set user_id = actor, status = 'active'
  where id = invite.id;

  update public.users
  set user_type = 'company',
      onboarding_status = 'completed',
      onboarding_step = 4
  where id = actor;

  return query
    select
      invite.company_id,
      coalesce(
        (
          select nullif(trim(cp.company_name), '')
          from public.company_profiles cp
          where cp.user_id = invite.company_id
        ),
        'a mingle company'
      );
end;
$$;

grant execute on function public.pending_company_invite() to authenticated;
grant execute on function public.claim_company_invite() to authenticated;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  connection_id uuid not null references public.connections (id) on delete cascade,
  scheduled_by uuid not null references public.users (id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  location_type text not null default 'video'
    check (location_type in ('video', 'in_person')),
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists interviews_company_id_idx on public.interviews (company_id);
create index if not exists interviews_connection_id_idx on public.interviews (connection_id);

alter table public.interviews enable row level security;

drop policy if exists "company team manages interviews" on public.interviews;
create policy "company team manages interviews" on public.interviews
  for all
  using (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = interviews.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = interviews.company_id
        and status = 'active'
        and user_id is not null
    )
  );

drop policy if exists "candidate views own interviews" on public.interviews;
create policy "candidate views own interviews" on public.interviews
  for select
  using (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  );
