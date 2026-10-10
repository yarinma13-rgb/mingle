-- Public, automatically-generated career pages: /careers/[companySlug].
-- Slugs are derived from company_name and never require manual setup.

alter table public.company_profiles add column if not exists slug text;

create unique index if not exists company_profiles_slug_idx
  on public.company_profiles (slug)
  where slug is not null;

create or replace function public.generate_company_profile_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  candidate text;
  suffix int := 1;
begin
  if new.slug is not null then
    return new;
  end if;
  if new.company_name is null or trim(new.company_name) = '' then
    return new;
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(trim(new.company_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then
    base_slug := 'company';
  end if;

  candidate := base_slug;
  while exists (
    select 1 from public.company_profiles
    where slug = candidate and id is distinct from new.id
  ) loop
    suffix := suffix + 1;
    candidate := base_slug || '-' || suffix::text;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists company_profiles_set_slug on public.company_profiles;
create trigger company_profiles_set_slug
  before insert or update on public.company_profiles
  for each row
  execute function public.generate_company_profile_slug();

-- Force the trigger to backfill slugs for rows that already exist.
update public.company_profiles set updated_at = updated_at where slug is null;

-- Anonymous-safe read of exactly what a career page needs, so RLS on the
-- underlying company_profiles/roles tables never has to change.
create or replace function public.career_page_by_slug(p_slug text)
returns table (
  company_name text,
  logo text,
  mission text,
  industry text,
  location text,
  description text,
  roles jsonb
)
language sql
security definer
set search_path = public
stable
as $$
  select
    cp.company_name,
    cp.logo,
    cp.mission,
    cp.industry,
    cp.location,
    cp.description,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'title', r.title,
            'department', r.department,
            'employmentType', r.employment_type,
            'workModel', r.work_model,
            'requiredSkills', r.required_skills
          )
          order by r.created_at desc
        )
        from public.roles r
        where r.company_id = cp.user_id and r.status = 'open'
      ),
      '[]'::jsonb
    ) as roles
  from public.company_profiles cp
  where cp.slug = p_slug
  limit 1;
$$;

grant execute on function public.career_page_by_slug(text) to anon, authenticated;

-- A candidate applying from a career page. Unique (role_id, candidate_id)
-- makes a repeat submission a no-op instead of a duplicate row.
create table if not exists public.role_applications (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);

create index if not exists role_applications_role_id_idx
  on public.role_applications (role_id);

alter table public.role_applications enable row level security;

drop policy if exists "candidate manages own applications" on public.role_applications;
create policy "candidate manages own applications" on public.role_applications
  for all
  using (auth.uid() = candidate_id)
  with check (auth.uid() = candidate_id);

drop policy if exists "company views applications to their roles" on public.role_applications;
create policy "company views applications to their roles" on public.role_applications
  for select
  using (
    exists (
      select 1 from public.roles r
      where r.id = role_applications.role_id
        and (
          auth.uid() = r.company_id
          or auth.uid() in (
            select user_id from public.company_members
            where company_id = r.company_id
              and status = 'active'
              and user_id is not null
          )
        )
    )
  );
