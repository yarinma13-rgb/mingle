-- MINGLE — allow either side of a connection to delete it.
--
-- Added after discovering that a pre-fix bug in sendOrAcceptConnection
-- could leave two rows for the same unordered pair (one per direction)
-- when a cancelled/declined reverse row existed. The app logic no
-- longer creates that state, but there was no way to clean up rows
-- already left over from it — this policy is also generally useful
-- for a real "remove connection" action later.

drop policy if exists "delete own connections" on public.connections;
create policy "delete own connections" on public.connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);
