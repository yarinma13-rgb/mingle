-- MINGLE — Phase 6: connection requests and states (PRODUCT_SPEC.md
-- section 29-34 Screen 14 "Connection request", and connection states
-- Pending/Accepted/Declined/Expired/Cancelled/Blocked).
--
-- One row per unordered pair, enforced in the app layer (see
-- lib/connections/persistence.ts): sending a request when the other
-- side already has a pending request to you accepts theirs instead of
-- creating a duplicate row, which is what makes "mutual interest"
-- resolve to a single accepted row rather than two independent ones.
-- MVP supports pending/accepted/declined/cancelled; expired/blocked
-- are left for a later phase once there's a real need to auto-expire
-- or moderate.

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.users (id) on delete cascade,
  recipient_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (requester_id, recipient_id),
  check (requester_id <> recipient_id)
);

alter table public.connections enable row level security;

drop policy if exists "view own connections" on public.connections;
create policy "view own connections" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

drop policy if exists "send connection request" on public.connections;
create policy "send connection request" on public.connections
  for insert with check (auth.uid() = requester_id);

drop policy if exists "respond to own connections" on public.connections;
create policy "respond to own connections" on public.connections
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id)
  with check (auth.uid() = requester_id or auth.uid() = recipient_id);

drop trigger if exists set_connections_updated_at on public.connections;
create trigger set_connections_updated_at
  before update on public.connections
  for each row execute function public.set_updated_at();
