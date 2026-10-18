-- Hardening for talent_exchange_interest (0047). Its RLS policy lets EITHER
-- participant write ANY column, so a candidate could set company_interested
-- themselves (and even create the underlying matches row for any company —
-- 0042 lets a participant insert), then "respond" to a fake interest and end
-- up connected to a company that never expressed any. This trigger enforces
-- who may set which side, and that "mutual" needs both sides genuinely in.
-- auth.uid() is null for the service role / SQL editor, which stay unrestricted.

create or replace function public.guard_talent_exchange_interest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  if auth.uid() is null then
    return new;
  end if;

  select company_id, candidate_id into m
  from public.matches where id = new.match_id;
  if not found then
    raise exception 'talent_exchange_interest: unknown match';
  end if;

  if new.company_interested
     and (tg_op = 'INSERT' or old.company_interested is distinct from new.company_interested)
     and not public.is_match_company_side(m.company_id) then
    raise exception 'only the company side can express company interest';
  end if;

  if new.candidate_interested is not null
     and (tg_op = 'INSERT' or old.candidate_interested is distinct from new.candidate_interested)
     and auth.uid() <> m.candidate_id then
    raise exception 'only the candidate can respond to company interest';
  end if;

  if new.status = 'mutual'
     and not (new.company_interested and coalesce(new.candidate_interested, false)) then
    raise exception 'mutual requires both sides to be interested';
  end if;

  if new.status = 'candidate_declined' and new.candidate_interested is distinct from false then
    raise exception 'candidate_declined requires candidate_interested = false';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_talent_exchange_interest on public.talent_exchange_interest;
create trigger guard_talent_exchange_interest
  before insert or update on public.talent_exchange_interest
  for each row execute function public.guard_talent_exchange_interest();
