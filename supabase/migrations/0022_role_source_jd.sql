-- Raw pasted JD / URL on the existing roles table (no parallel jobs entity).

alter table public.roles
  add column if not exists source_jd text;

alter table public.roles
  add column if not exists source_url text;
