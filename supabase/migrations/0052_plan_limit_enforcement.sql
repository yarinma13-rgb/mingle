-- Server-side plan limits (the UI also checks, but roles and team invites are
-- written straight from the browser under RLS, so the only tamper-proof place
-- to enforce "3 active jobs on Core" is the database).
--
-- A company with no company_subscriptions row, or a grandfathered one (free,
-- existing before billing), is unlimited. Service-role writes (auth.uid() is
-- null) are internal and not limited. Limits mirror lib/billing/plans.ts.

create or replace function public.company_plan_limit(p_company uuid, p_kind text)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s.company_id is null or s.grandfathered then null
    when p_kind = 'jobs' then case s.plan when 'core' then 3 when 'plus' then 10 when 'max' then 25 end
    when p_kind = 'team' then case s.plan when 'core' then 3 when 'plus' then 10 when 'max' then 25 end
  end
  from (select 1) one
  left join public.company_subscriptions s on s.company_id = p_company;
$$;

create or replace function public.enforce_active_jobs_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int;
  open_count int;
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.status <> 'open' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'open' then
    return new;
  end if;

  lim := public.company_plan_limit(new.company_id, 'jobs');
  if lim is null then
    return new;
  end if;

  select count(*) into open_count
  from public.roles
  where company_id = new.company_id and status = 'open' and id <> new.id;

  if open_count >= lim then
    raise exception 'plan_limit_jobs' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_active_jobs_limit on public.roles;
create trigger enforce_active_jobs_limit
  before insert or update of status on public.roles
  for each row execute function public.enforce_active_jobs_limit();

create or replace function public.enforce_team_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int;
  member_count int;
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.status not in ('active', 'invited') then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('active', 'invited') then
    return new;
  end if;

  lim := public.company_plan_limit(new.company_id, 'team');
  if lim is null then
    return new;
  end if;

  -- The owner counts as one user.
  select count(*) + 1 into member_count
  from public.company_members
  where company_id = new.company_id
    and status in ('active', 'invited')
    and id <> new.id;

  if member_count >= lim then
    raise exception 'plan_limit_team' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_team_limit on public.company_members;
create trigger enforce_team_limit
  before insert or update of status on public.company_members
  for each row execute function public.enforce_team_limit();
