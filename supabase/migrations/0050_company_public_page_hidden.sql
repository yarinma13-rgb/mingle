-- Lets us hide a company's public career page (/careers/[slug]) and its
-- sitemap entry without deleting the company or its data. Every company
-- profile got an automatic public page in 0039 with no opt-out.

alter table public.company_profiles
  add column if not exists public_page_hidden boolean not null default false;

comment on column public.company_profiles.public_page_hidden is
  'When true the company has no public /careers page and is left out of the sitemap.';

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
    and not cp.public_page_hidden
  limit 1;
$$;

grant execute on function public.career_page_by_slug(text) to anon, authenticated;

-- Hide the account that signed up from an AWS script (node user agent,
-- disposable email) on 2026-10-18 until it is confirmed to be real.
update public.company_profiles
  set public_page_hidden = true
  where slug = 'clearsky-solar-inc';
