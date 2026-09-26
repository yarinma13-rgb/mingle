-- Talent → talent organic referrals (distinct from company role_referrals).
-- Personal invite codes, click/share counts, and signup attribution.

create table if not exists public.talent_referral_codes (
  user_id uuid primary key references public.users (id) on delete cascade,
  code text not null unique,
  share_count int not null default 0,
  open_count int not null default 0,
  signup_started_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint talent_referral_codes_code_format
    check (code ~ '^[a-z0-9]{6,12}$')
);

create index if not exists talent_referral_codes_code_idx
  on public.talent_referral_codes (code);

create table if not exists public.talent_referral_opens (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.talent_referral_codes (code) on delete cascade,
  visitor_key text not null,
  created_at timestamptz not null default now(),
  unique (code, visitor_key)
);

create index if not exists talent_referral_opens_code_idx
  on public.talent_referral_opens (code);

create table if not exists public.talent_referral_attributions (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users (id) on delete cascade,
  referred_user_id uuid not null unique references public.users (id) on delete cascade,
  code text not null,
  status text not null default 'signed_up'
    check (status in ('signed_up', 'profile_completed', 'matched')),
  created_at timestamptz not null default now(),
  profile_completed_at timestamptz,
  matched_at timestamptz,
  constraint talent_referral_no_self check (referrer_user_id <> referred_user_id)
);

create index if not exists talent_referral_attributions_referrer_idx
  on public.talent_referral_attributions (referrer_user_id, created_at desc);

alter table public.talent_referral_codes enable row level security;
alter table public.talent_referral_opens enable row level security;
alter table public.talent_referral_attributions enable row level security;

drop policy if exists "talent manage own referral code" on public.talent_referral_codes;
create policy "talent manage own referral code" on public.talent_referral_codes
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "talent read own referral attributions" on public.talent_referral_attributions;
create policy "talent read own referral attributions" on public.talent_referral_attributions
  for select to authenticated
  using (
    auth.uid() = referrer_user_id
    or auth.uid() = referred_user_id
  );

drop trigger if exists set_talent_referral_codes_updated_at on public.talent_referral_codes;
create trigger set_talent_referral_codes_updated_at
  before update on public.talent_referral_codes
  for each row execute function public.set_updated_at();

-- Record a unique open for a code + visitor. Bumps open_count once per visitor.
create or replace function public.record_talent_referral_open(
  p_code text,
  p_visitor_key text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int;
  normalized text := lower(trim(p_code));
begin
  if normalized is null or length(normalized) < 6 then
    return false;
  end if;
  if p_visitor_key is null or length(trim(p_visitor_key)) < 8 then
    return false;
  end if;
  if not exists (
    select 1 from public.talent_referral_codes where code = normalized
  ) then
    return false;
  end if;

  insert into public.talent_referral_opens (code, visitor_key)
  values (normalized, trim(p_visitor_key))
  on conflict (code, visitor_key) do nothing;

  get diagnostics inserted = row_count;
  if inserted > 0 then
    update public.talent_referral_codes
    set open_count = open_count + 1
    where code = normalized;
  end if;
  return true;
end;
$$;

grant execute on function public.record_talent_referral_open(text, text) to anon, authenticated;

-- Attribute signup to a talent referrer. Idempotent; blocks self-referral.
create or replace function public.claim_talent_referral(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  referrer uuid;
  normalized text := lower(trim(p_code));
begin
  if actor is null then
    raise exception 'not signed in';
  end if;
  if normalized is null or length(normalized) < 6 then
    return;
  end if;

  select user_id into referrer
  from public.talent_referral_codes
  where code = normalized;

  if referrer is null then
    return;
  end if;

  -- Self-referral / already attributed elsewhere → no-op.
  if referrer = actor then
    return;
  end if;

  if exists (
    select 1 from public.talent_referral_attributions
    where referred_user_id = actor
  ) then
    return;
  end if;

  insert into public.talent_referral_attributions (
    referrer_user_id,
    referred_user_id,
    code,
    status
  )
  values (referrer, actor, normalized, 'signed_up')
  on conflict (referred_user_id) do nothing;
end;
$$;

grant execute on function public.claim_talent_referral(text) to authenticated;

create or replace function public.bump_talent_referral_share(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  owner uuid;
  normalized text := lower(trim(p_code));
begin
  if actor is null or normalized is null then
    return;
  end if;
  select user_id into owner
  from public.talent_referral_codes
  where code = normalized;
  if owner is null or owner <> actor then
    return;
  end if;
  update public.talent_referral_codes
  set share_count = share_count + 1
  where code = normalized;
end;
$$;

grant execute on function public.bump_talent_referral_share(text) to authenticated;

-- Count unique visitors who reached signup with a stashed code.
create or replace function public.bump_talent_referral_signup_started(
  p_code text,
  p_visitor_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(trim(p_code));
  visitor text := trim(p_visitor_key);
  inserted int;
begin
  if normalized is null or length(normalized) < 6 then
    return;
  end if;
  if visitor is null or length(visitor) < 8 then
    return;
  end if;
  if not exists (
    select 1 from public.talent_referral_codes where code = normalized
  ) then
    return;
  end if;

  -- Reuse opens uniqueness with a dedicated signup marker key.
  insert into public.talent_referral_opens (code, visitor_key)
  values (normalized, 'signup:' || visitor)
  on conflict (code, visitor_key) do nothing;

  get diagnostics inserted = row_count;
  if inserted > 0 then
    update public.talent_referral_codes
    set signup_started_count = signup_started_count + 1
    where code = normalized;
  end if;
end;
$$;

grant execute on function public.bump_talent_referral_signup_started(text, text)
  to anon, authenticated;

-- Referred user completed their profile (idempotent upgrade).
create or replace function public.mark_talent_referral_profile_completed()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return;
  end if;
  update public.talent_referral_attributions
  set
    status = case
      when status = 'matched' then status
      else 'profile_completed'
    end,
    profile_completed_at = coalesce(profile_completed_at, now())
  where referred_user_id = actor
    and profile_completed_at is null;
end;
$$;

grant execute on function public.mark_talent_referral_profile_completed() to authenticated;

-- Referred user got their first match / accepted connection.
create or replace function public.mark_talent_referral_matched()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    return;
  end if;
  update public.talent_referral_attributions
  set
    status = 'matched',
    matched_at = coalesce(matched_at, now()),
    profile_completed_at = coalesce(profile_completed_at, now())
  where referred_user_id = actor
    and matched_at is null;
end;
$$;

grant execute on function public.mark_talent_referral_matched() to authenticated;
