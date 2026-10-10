-- MUST_HAVE/PREFERRED/TRANSFERABLE/DEVELOPMENTAL/CONTEXTUAL/UNKNOWN tiering
-- for a role's required_skills, so Role Fit can weight a missing must-have
-- skill differently from a missing nice-to-have one. Additive-only: keeps
-- required_skills as the flat source of truth, this is metadata alongside it.
-- Shape: [{ skill: string, tier: string, rationale?: string }, ...]

alter table public.roles
  add column if not exists skill_requirements jsonb not null default '[]';
