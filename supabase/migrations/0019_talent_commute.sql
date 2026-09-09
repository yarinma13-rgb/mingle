-- Optional commute radius on talent profiles (handoff 2026-09-09 item 19).

alter table public.talent_profiles
  add column if not exists max_commute_km int;
