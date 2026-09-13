-- Interview calendar: Google Calendar connect, propose 2-3 slots, talent accepts.
-- Advances relationship stage to interview_booked and optionally creates a Meet event.

alter table public.relationship_events
  drop constraint if exists relationship_events_stage_check;

alter table public.relationship_events
  add constraint relationship_events_stage_check
  check (
    stage in (
      'connected',
      'exploring',
      'in_conversation',
      'interview_booked',
      'opportunity',
      'decision',
      'relationship'
    )
  );

create table if not exists public.company_calendar_connections (
  company_id uuid primary key references public.users (id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  account_email text,
  connected_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_calendar_connections enable row level security;

drop policy if exists "company manages own calendar connection"
  on public.company_calendar_connections;
create policy "company manages own calendar connection"
  on public.company_calendar_connections
  for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

create table if not exists public.interview_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  connection_id uuid not null references public.connections (id) on delete cascade,
  proposed_by uuid not null references public.users (id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  duration_minutes int not null default 30
    check (duration_minutes between 15 and 180),
  location_type text not null default 'video'
    check (location_type in ('video', 'in_person')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists interview_proposals_connection_idx
  on public.interview_proposals (connection_id);

create table if not exists public.interview_proposal_slots (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null
    references public.interview_proposals (id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'offered'
    check (status in ('offered', 'selected', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists interview_proposal_slots_proposal_idx
  on public.interview_proposal_slots (proposal_id);

alter table public.interview_proposals enable row level security;
alter table public.interview_proposal_slots enable row level security;

drop policy if exists "company manages interview proposals" on public.interview_proposals;
create policy "company manages interview proposals"
  on public.interview_proposals for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "connection parties read interview proposals" on public.interview_proposals;
create policy "connection parties read interview proposals"
  on public.interview_proposals for select
  using (
    auth.uid() in (
      select requester_id from public.connections where id = connection_id
      union
      select recipient_id from public.connections where id = connection_id
    )
  );

drop policy if exists "company manages proposal slots" on public.interview_proposal_slots;
create policy "company manages proposal slots"
  on public.interview_proposal_slots for all
  using (
    exists (
      select 1 from public.interview_proposals p
      where p.id = proposal_id and p.company_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interview_proposals p
      where p.id = proposal_id and p.company_id = auth.uid()
    )
  );

drop policy if exists "connection parties read proposal slots" on public.interview_proposal_slots;
create policy "connection parties read proposal slots"
  on public.interview_proposal_slots for select
  using (
    exists (
      select 1
      from public.interview_proposals p
      join public.connections c on c.id = p.connection_id
      where p.id = proposal_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

alter table public.interviews
  add column if not exists google_event_id text;
alter table public.interviews
  add column if not exists meet_link text;
alter table public.interviews
  add column if not exists proposal_id uuid
    references public.interview_proposals (id) on delete set null;

create or replace function public.book_interview_from_slot(p_slot_id uuid)
returns table (
  interview_id uuid,
  company_id uuid,
  connection_id uuid,
  scheduled_at timestamptz,
  duration_minutes int,
  location_type text,
  notes text,
  talent_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  slot public.interview_proposal_slots%rowtype;
  proposal public.interview_proposals%rowtype;
  conn public.connections%rowtype;
  new_interview_id uuid;
begin
  if actor is null then
    raise exception 'not signed in';
  end if;

  select * into slot from public.interview_proposal_slots where id = p_slot_id for update;
  if not found then raise exception 'slot not found'; end if;
  if slot.status <> 'offered' then raise exception 'slot unavailable'; end if;

  select * into proposal from public.interview_proposals where id = slot.proposal_id for update;
  if not found or proposal.status <> 'pending' then raise exception 'proposal unavailable'; end if;

  select * into conn from public.connections where id = proposal.connection_id;
  if not found or conn.status <> 'accepted' then raise exception 'connection not ready'; end if;
  if actor <> conn.requester_id and actor <> conn.recipient_id then
    raise exception 'not a party to this connection';
  end if;

  update public.interview_proposal_slots set status = 'selected' where id = slot.id;
  update public.interview_proposal_slots
    set status = 'rejected'
    where proposal_id = proposal.id and id <> slot.id and status = 'offered';
  update public.interview_proposals set status = 'accepted' where id = proposal.id;

  insert into public.interviews (
    company_id, connection_id, scheduled_by, scheduled_at,
    duration_minutes, location_type, notes, status, proposal_id
  ) values (
    proposal.company_id, proposal.connection_id, actor, slot.starts_at,
    proposal.duration_minutes, proposal.location_type, proposal.notes,
    'scheduled', proposal.id
  ) returning id into new_interview_id;

  insert into public.relationship_events (connection_id, stage, actor_id, metadata)
  values (
    proposal.connection_id,
    'interview_booked',
    actor,
    jsonb_build_object(
      'interview_id', new_interview_id,
      'scheduled_at', slot.starts_at,
      'duration_minutes', proposal.duration_minutes
    )
  );

  return query select
    new_interview_id,
    proposal.company_id,
    proposal.connection_id,
    slot.starts_at,
    proposal.duration_minutes,
    proposal.location_type,
    proposal.notes,
    case when conn.requester_id = proposal.company_id then conn.recipient_id else conn.requester_id end;
end;
$$;

grant execute on function public.book_interview_from_slot(uuid) to authenticated;

create or replace function public.calendar_tokens_for_pending_proposal(p_proposal_id uuid)
returns table (
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text,
  account_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  proposal public.interview_proposals%rowtype;
  conn public.connections%rowtype;
begin
  if actor is null then raise exception 'not signed in'; end if;
  select * into proposal from public.interview_proposals where id = p_proposal_id;
  if not found then return; end if;
  select * into conn from public.connections where id = proposal.connection_id;
  if not found then return; end if;
  if actor <> conn.requester_id and actor <> conn.recipient_id and actor <> proposal.company_id then
    raise exception 'not allowed';
  end if;
  if proposal.status not in ('pending', 'accepted') then return; end if;
  return query
    select c.refresh_token, c.access_token, c.access_token_expires_at, c.calendar_id, c.account_email
    from public.company_calendar_connections c
    where c.company_id = proposal.company_id;
end;
$$;

grant execute on function public.calendar_tokens_for_pending_proposal(uuid) to authenticated;

drop policy if exists "connection parties update interview calendar fields" on public.interviews;
create policy "connection parties update interview calendar fields"
  on public.interviews for update
  using (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  )
  with check (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  );
