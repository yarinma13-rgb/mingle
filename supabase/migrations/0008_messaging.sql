-- MINGLE — Phase 7: real messaging (PRODUCT_SPEC.md section 36-42
-- Screen 16 "Messaging"). One conversation per accepted connection;
-- messages carry their own read state per message rather than a
-- separate read-receipts table, which is enough for a two-person
-- thread.
--
-- Notifications (section 47) are deliberately NOT a separate table —
-- "new connection request" and "new message" are derived live from
-- connections.status = 'pending' and messages.read_at is null, so
-- there is nothing that can drift out of sync with the data it is
-- supposed to reflect.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.connections (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "view own conversations" on public.conversations;
create policy "view own conversations" on public.conversations
  for select using (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists "create conversation on own accepted connection" on public.conversations;
create policy "create conversation on own accepted connection" on public.conversations
  for insert with check (
    exists (
      select 1 from public.connections c
      where c.id = conversations.connection_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists "view own messages" on public.messages;
create policy "view own messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists "send own messages" on public.messages;
create policy "send own messages" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and c.status = 'accepted'
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

drop policy if exists "mark messages read in own conversations" on public.messages;
create policy "mark messages read in own conversations" on public.messages
  for update using (
    exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.conversations conv
      join public.connections c on c.id = conv.connection_id
      where conv.id = messages.conversation_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

-- Realtime delivery per PRODUCT_SPEC.md section 36-42. Guarded so this
-- migration can be re-run safely (ALTER PUBLICATION has no built-in
-- "if not exists" for ADD TABLE).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
