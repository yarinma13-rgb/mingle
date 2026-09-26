-- 0024 turned on RLS for the pilot learning tables but added zero policies,
-- which (correctly, for schema-only placeholders) means nobody could read
-- or write them. Now that 0042-0044 give them a real matches anchor and
-- Phase 2 actually starts writing match_feature_snapshots/match_evidence,
-- add participant-scoped policies (using the is_match_participant /
-- is_match_company_side helpers from 0042, which already cover active
-- company_members, not just the workspace owner). interview_feedback/
-- employment_outcomes get read/write policies too so Phase 5 can wire them
-- later without another migration, even though nothing writes
-- employment_outcomes yet.

drop policy if exists "participants can read match feature snapshots" on public.match_feature_snapshots;
create policy "participants can read match feature snapshots" on public.match_feature_snapshots
  for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_feature_snapshots.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );

drop policy if exists "participants can write match feature snapshots" on public.match_feature_snapshots;
create policy "participants can write match feature snapshots" on public.match_feature_snapshots
  for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_feature_snapshots.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );

drop policy if exists "participants can read match evidence" on public.match_evidence;
create policy "participants can read match evidence" on public.match_evidence
  for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_evidence.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );

drop policy if exists "participants can write match evidence" on public.match_evidence;
create policy "participants can write match evidence" on public.match_evidence
  for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = match_evidence.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );

-- Interview feedback: only the company side records it about a candidate.
drop policy if exists "company can read interview feedback" on public.interview_feedback;
create policy "company can read interview feedback" on public.interview_feedback
  for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = interview_feedback.match_id
        and public.is_match_company_side(m.company_id)
    )
  );

drop policy if exists "company can write interview feedback" on public.interview_feedback;
create policy "company can write interview feedback" on public.interview_feedback
  for insert
  with check (
    exists (
      select 1 from public.matches m
      where m.id = interview_feedback.match_id
        and public.is_match_company_side(m.company_id)
    )
  );

-- employment_outcomes: read-only policy for now — nothing writes to this
-- table yet (see lib/matching/outcome-learning.ts), by deliberate product
-- decision until the product has a real "hired" signal to key off of.
drop policy if exists "participants can read employment outcomes" on public.employment_outcomes;
create policy "participants can read employment outcomes" on public.employment_outcomes
  for select
  using (
    exists (
      select 1 from public.matches m
      where m.id = employment_outcomes.match_id
        and public.is_match_participant(m.company_id, m.candidate_id)
    )
  );
