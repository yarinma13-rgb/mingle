-- Self-reported current employer, collected during onboarding when a
-- talent says they're currently employed (required there, not optional —
-- see components/ProfileWizard.tsx step 2). Used only to make sure a
-- candidate never appears as a match to their own current employer (see
-- lib/matching/employer-exclusion.ts) — never shown publicly.

alter table public.talent_profiles
  add column if not exists current_employer text;

comment on column public.talent_profiles.current_employer is
  'Self-reported current employer name. Used only for employer-exclusion matching safety (never let a candidate appear as a match to their own employer) — never displayed publicly.';
