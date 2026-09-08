-- Talent compensation (private) and skills, for salary-fit tags on
-- company role pages. salary_expectation must never be rendered to
-- companies; skills are visible like other profile chips.
-- Also requested: a commute radius on talent. Still blocked on geocoding
-- (handoff item 8) — do not add a distance column here.

alter table public.talent_profiles
  add column if not exists salary_expectation int,
  add column if not exists skills text[] not null default '{}';
