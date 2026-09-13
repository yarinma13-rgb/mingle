-- Birth date is collected at registration for internal matching/eligibility.
-- It must not be rendered on public/shared profile surfaces.

alter table public.talent_profiles
  add column if not exists birth_date date;

comment on column public.talent_profiles.birth_date is
  'Private registration field. Not shown on the public talent profile.';
