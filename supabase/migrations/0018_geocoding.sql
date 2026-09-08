-- MINGLE — geocode cache columns for Discover distance (handoff 6.5).
-- Free-text location stays the source of truth. Nominatim fills these on save.

alter table public.talent_profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.company_profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
