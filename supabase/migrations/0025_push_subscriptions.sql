-- Web Push subscriptions. App writes own rows; related users fetch via RPC.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "manage own push subscriptions" on public.push_subscriptions;
create policy "manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.list_related_push_subscriptions(p_user_id uuid)
returns table (endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
as $$
  select s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  where s.user_id = p_user_id
    and (
      p_user_id = auth.uid()
      or exists (
        select 1
        from public.connections c
        where (
          (c.requester_id = auth.uid() and c.recipient_id = p_user_id)
          or (c.recipient_id = auth.uid() and c.requester_id = p_user_id)
        )
      )
      or exists (
        select 1
        from public.match_feedback f
        where (
          (f.actor_id = auth.uid() and f.target_user_id = p_user_id)
          or (f.actor_id = p_user_id and f.target_user_id = auth.uid())
        )
      )
    );
$$;

grant execute on function public.list_related_push_subscriptions(uuid) to authenticated;
