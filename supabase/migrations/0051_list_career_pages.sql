-- Public, anonymous-safe list of company career pages for sitemap.xml.
-- listCareerPages used to read company_profiles/roles directly; for an
-- anonymous crawler (Googlebot) RLS returns nothing, so sitemap.xml never
-- listed any company page. Same security-definer pattern as career_page_by_slug.

alter table public.company_profiles
  add column if not exists public_page_hidden boolean not null default false;

create or replace function public.list_career_pages()
returns table (slug text)
language sql
security definer
set search_path = public
stable
as $$
  select cp.slug
  from public.company_profiles cp
  where cp.slug is not null
    and not cp.public_page_hidden
    and exists (
      select 1 from public.roles r
      where r.company_id = cp.user_id and r.status = 'open'
    )
  order by cp.slug;
$$;

grant execute on function public.list_career_pages() to anon, authenticated;
