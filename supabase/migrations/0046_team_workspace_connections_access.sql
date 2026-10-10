-- Team workspace access: company_members (active teammates) already share
-- full read/write access to `interviews` (see 0017's "company team manages
-- interviews" policy) — this extends the same "whole team sees everything"
-- model to connections, the board timeline, interview proposals, proposal
-- slots, and the shared Google Calendar connection, which were all still
-- scoped to literally auth.uid() = <owner column> with no company_members
-- awareness. Added alongside the existing owner-only policies (permissive
-- policies OR together), not replacing them.

drop policy if exists "team workspace manages connections" on public.connections;
create policy "team workspace manages connections" on public.connections
  for all
  using (
    auth.uid() in (
      select user_id from public.company_members
      where status = 'active'
        and user_id is not null
        and company_id in (requester_id, recipient_id)
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.company_members
      where status = 'active'
        and user_id is not null
        and company_id in (requester_id, recipient_id)
    )
  );

drop policy if exists "team workspace views relationship events" on public.relationship_events;
create policy "team workspace views relationship events" on public.relationship_events
  for select using (
    exists (
      select 1
      from public.connections c
      join public.company_members cm
        on cm.status = 'active'
        and cm.user_id is not null
        and cm.company_id in (c.requester_id, c.recipient_id)
      where c.id = relationship_events.connection_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "team workspace records relationship events" on public.relationship_events;
create policy "team workspace records relationship events" on public.relationship_events
  for insert with check (
    exists (
      select 1
      from public.connections c
      join public.company_members cm
        on cm.status = 'active'
        and cm.user_id is not null
        and cm.company_id in (c.requester_id, c.recipient_id)
      where c.id = relationship_events.connection_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "team workspace manages interview proposals" on public.interview_proposals;
create policy "team workspace manages interview proposals" on public.interview_proposals
  for all
  using (
    auth.uid() in (
      select user_id from public.company_members
      where company_id = interview_proposals.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.company_members
      where company_id = interview_proposals.company_id
        and status = 'active'
        and user_id is not null
    )
  );

drop policy if exists "team workspace manages proposal slots" on public.interview_proposal_slots;
create policy "team workspace manages proposal slots" on public.interview_proposal_slots
  for all
  using (
    exists (
      select 1
      from public.interview_proposals p
      join public.company_members cm
        on cm.company_id = p.company_id
        and cm.status = 'active'
        and cm.user_id is not null
      where p.id = interview_proposal_slots.proposal_id
        and cm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.interview_proposals p
      join public.company_members cm
        on cm.company_id = p.company_id
        and cm.status = 'active'
        and cm.user_id is not null
      where p.id = interview_proposal_slots.proposal_id
        and cm.user_id = auth.uid()
    )
  );

drop policy if exists "team workspace manages calendar connection" on public.company_calendar_connections;
create policy "team workspace manages calendar connection" on public.company_calendar_connections
  for all
  using (
    auth.uid() in (
      select user_id from public.company_members
      where company_id = company_calendar_connections.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() in (
      select user_id from public.company_members
      where company_id = company_calendar_connections.company_id
        and status = 'active'
        and user_id is not null
    )
  );
