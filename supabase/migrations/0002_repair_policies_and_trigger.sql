-- MINGLE — repair script: safely re-applies RLS policies, the updated_at
-- triggers, and the signup trigger, regardless of what already exists.
-- Safe to run multiple times. Run this if 0001 partially applied.

-- ── row level security (idempotent) ───────────────────────────────
alter table public.users enable row level security;
alter table public.talent_preferences enable row level security;
alter table public.company_preferences enable row level security;

drop policy if exists "users select own row" on public.users;
create policy "users select own row" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users update own row" on public.users;
create policy "users update own row" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "users insert own row" on public.users;
create policy "users insert own row" on public.users
  for insert with check (auth.uid() = id);

drop policy if exists "talent manage own preferences" on public.talent_preferences;
create policy "talent manage own preferences" on public.talent_preferences
  for all using (auth.uid() = talent_id) with check (auth.uid() = talent_id);

drop policy if exists "company manage own preferences" on public.company_preferences;
create policy "company manage own preferences" on public.company_preferences
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

-- ── updated_at maintenance (idempotent) ───────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists set_talent_preferences_updated_at on public.talent_preferences;
create trigger set_talent_preferences_updated_at
  before update on public.talent_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists set_company_preferences_updated_at on public.company_preferences;
create trigger set_company_preferences_updated_at
  before update on public.company_preferences
  for each row execute function public.set_updated_at();

-- ── auto-create public.users row on signup (idempotent) ───────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, user_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'user_type', 'talent')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── verify ─────────────────────────────────────────────────────────
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
