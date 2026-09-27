-- Mingo capability 1: implicit "quiet signals" inferred from a free-text JD
-- (culture/working-style fit) — distinct from the explicit required_skills.
alter table public.roles
  add column if not exists quiet_signals text[] not null default '{}';
