-- MINGLE — talent gender, used for avatar fallback color
-- (male = blue, female = pink, prefer not to say = purple).
-- Do not make this public in UI copy beyond the three options.

alter table public.talent_profiles
  add column if not exists gender text;

alter table public.talent_profiles
  drop constraint if exists talent_profiles_gender_check;

alter table public.talent_profiles
  add constraint talent_profiles_gender_check
  check (
    gender is null
    or gender in ('male', 'female', 'prefer_not_to_say')
  );
