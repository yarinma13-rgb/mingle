-- Talent search signals (employment, discreet, start availability, target role)
-- plus optional structured JD sections on roles (Gemini / paste rewrite).

alter table public.talent_profiles
  add column if not exists is_employed boolean,
  add column if not exists discreet_search boolean not null default false,
  add column if not exists start_availability text,
  add column if not exists target_role text;

comment on column public.talent_profiles.is_employed is
  'Whether the talent is currently employed. Null = not answered.';
comment on column public.talent_profiles.discreet_search is
  'True when the talent wants a discreet / confidential job search.';
comment on column public.talent_profiles.start_availability is
  'When they can start (Immediate, 2 weeks, 1 month, Notice period, Flexible).';
comment on column public.talent_profiles.target_role is
  'Free-text role they are looking for today — used as soft Discover / match signal.';

alter table public.roles
  add column if not exists company_presentation text,
  add column if not exists job_presentation text,
  add column if not exists responsibilities text,
  add column if not exists requirements text;

comment on column public.roles.company_presentation is
  'Structured company blurb from free-text JD rewrite (editable).';
comment on column public.roles.job_presentation is
  'Structured job blurb from free-text JD rewrite (editable).';
comment on column public.roles.responsibilities is
  'Structured responsibilities from free-text JD rewrite (editable).';
comment on column public.roles.requirements is
  'Structured requirements from free-text JD rewrite (editable).';
