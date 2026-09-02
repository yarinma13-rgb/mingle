-- MINGLE — Phase 8: relationship timeline (PRODUCT_SPEC.md section 6
-- relationship_events, section 36 relationship timeline, sections
-- 37-39 Explore/Opportunity/Decision).
--
-- One row per stage transition, so the timeline is a real append-only
-- history rather than a single mutable "current stage" column — this
-- is what makes it a foundation for analytics later, per spec, and
-- what replaces Phase 7's live-computed 3-state heuristic with an
-- actual stored progression.
--
-- metadata carries stage-specific detail (e.g. the decision chosen,
-- the opportunity's role/context) without needing a separate table
-- per stage — proportionate for what Phase 8 actually needs to show.

create table if not exists public.relationship_events (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  stage text not null
    check (stage in ('connected', 'exploring', 'in_conversation', 'opportunity', 'decision', 'relationship')),
  actor_id uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists relationship_events_connection_id_created_at_idx
  on public.relationship_events (connection_id, created_at);

alter table public.relationship_events enable row level security;

drop policy if exists "view own relationship events" on public.relationship_events;
create policy "view own relationship events" on public.relationship_events
  for select using (
    exists (
      select 1 from public.connections c
      where c.id = relationship_events.connection_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists "record own relationship events" on public.relationship_events;
create policy "record own relationship events" on public.relationship_events
  for insert with check (
    exists (
      select 1 from public.connections c
      where c.id = relationship_events.connection_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );
