-- Retrofit the pilot learning tables from 0024 to reference the real
-- matches anchor from 0042, now that one exists. Safe: all four tables are
-- confirmed empty/unwritten in application code as of this migration, so
-- adding a FK to a previously bare `match_id uuid` column cannot violate
-- any existing row.

alter table public.match_feature_snapshots
  add constraint match_feature_snapshots_match_id_fkey
  foreign key (match_id) references public.matches (id) on delete cascade;

alter table public.match_evidence
  add constraint match_evidence_match_id_fkey
  foreign key (match_id) references public.matches (id) on delete cascade;

alter table public.interview_feedback
  add constraint interview_feedback_match_id_fkey
  foreign key (match_id) references public.matches (id) on delete cascade;

alter table public.employment_outcomes
  add constraint employment_outcomes_match_id_fkey
  foreign key (match_id) references public.matches (id) on delete cascade;
