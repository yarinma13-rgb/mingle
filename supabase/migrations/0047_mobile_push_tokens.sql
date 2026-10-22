-- Expo push tokens for the native mobile app (apps/mobile). Separate from
-- public.push_subscriptions (0025), which is Web Push (VAPID + endpoint/
-- p256dh/auth) for the browser app — a different protocol entirely, not
-- something an Expo push token can be shoehorned into. Same ownership and
-- "related users can look up tokens to notify" shape as that table.

create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  expo_push_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mobile_push_tokens_user_idx
  on public.mobile_push_tokens (user_id);

alter table public.mobile_push_tokens enable row level security;

drop policy if exists "manage own mobile push tokens" on public.mobile_push_tokens;
create policy "manage own mobile push tokens" on public.mobile_push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_mobile_push_tokens_updated_at on public.mobile_push_tokens;
create trigger set_mobile_push_tokens_updated_at
  before update on public.mobile_push_tokens
  for each row execute function public.set_updated_at();

-- Mirrors list_related_push_subscriptions (0025): lets the actor look up
-- a related user's device tokens only when they're actually related
-- (self, connected, or have exchanged match feedback) — never an
-- unrelated user's tokens. Send-side (calling Expo's push API with these
-- tokens) is not wired up yet; this just makes the lookup safe to call
-- once it is.
create or replace function public.list_related_mobile_push_tokens(p_user_id uuid)
returns table (expo_push_token text)
language sql
security definer
set search_path = public
as $$
  select t.expo_push_token
  from public.mobile_push_tokens t
  where t.user_id = p_user_id
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

grant execute on function public.list_related_mobile_push_tokens(uuid) to authenticated;
