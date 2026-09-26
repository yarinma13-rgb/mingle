-- Employee referrals: a teammate generates a personal share link for a
-- specific open role; when someone signs up via that link, the referral
-- is attributed to them, and the company can track/mark a bonus paid.

create table if not exists public.role_referrals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  role_id uuid not null references public.roles (id) on delete cascade,
  referrer_user_id uuid not null references public.users (id) on delete cascade,
  referred_user_id uuid references public.users (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (role_id, referrer_user_id)
);

create index if not exists role_referrals_company_id_idx
  on public.role_referrals (company_id);

alter table public.role_referrals enable row level security;

drop policy if exists "team workspace manages role referrals" on public.role_referrals;
create policy "team workspace manages role referrals" on public.role_referrals
  for all
  using (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = role_referrals.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = role_referrals.company_id
        and status = 'active'
        and user_id is not null
    )
  );

-- A newly-signed-up user isn't part of the referring company's workspace,
-- so the RLS policy above won't let them write into this row. This
-- SECURITY DEFINER function is the narrow, one-time exception: it only
-- ever sets referred_user_id (once, to the caller's own id), the same
-- shape as claim_company_invite() in 0017.
create or replace function public.claim_role_referral(p_referral_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'not signed in';
  end if;

  update public.role_referrals
  set referred_user_id = actor
  where id = p_referral_id
    and referred_user_id is null
    and referrer_user_id <> actor;
end;
$$;

grant execute on function public.claim_role_referral(uuid) to authenticated;
