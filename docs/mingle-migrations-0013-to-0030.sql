
-- ################################################################
-- 0013_company_logo_storage.sql
-- מה זה: לוגו חברה (storage ציבורי)
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- MINGLE — company logo storage. Public bucket (logos are shown to
-- candidates and on public-facing surfaces), unlike the private
-- talent-cv / talent-profile-photo buckets in 0010/0011.
--
-- components/CompanyProfileWizard.tsx uploads to bucket "logos" and
-- calls getPublicUrl() — this bucket did not exist yet, which is why
-- every upload silently failed and fell back to the "skip for now"
-- error message.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company upload own logo" on storage.objects;
create policy "company upload own logo"
  on storage.objects
  for insert
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "company update own logo" on storage.objects;
create policy "company update own logo"
  on storage.objects
  for update
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "company delete own logo" on storage.objects;
create policy "company delete own logo"
  on storage.objects
  for delete
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No select policy needed: the bucket is public, so storage.objects
-- reads for it are served without auth by Supabase's public bucket path.


-- ################################################################
-- 0014_company_roles.sql
-- מה זה: טבלת Roles / משרות לחברה
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- MINGLE — company role / job builder (handoff 6.1).
-- Owner-only RLS, matching company_profiles write access. Candidates do
-- not read this table yet; Discover exposure is a later decision.
-- salary_min / salary_max are schema-only for 6.3 and must not be shown
-- in any UI until that work lands.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  department text,
  seniority text,
  employment_type text
    check (employment_type is null or employment_type in (
      'full_time', 'part_time', 'contract', 'freelance'
    )),
  work_model text
    check (work_model is null or work_model in (
      'Remote', 'Hybrid', 'Office based'
    )),
  required_skills text[] not null default '{}',
  description text,
  status text not null default 'open'
    check (status in ('open', 'paused', 'closed')),
  salary_min int,
  salary_max int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists roles_company_id_idx on public.roles (company_id);
create index if not exists roles_company_status_idx on public.roles (company_id, status);

alter table public.roles enable row level security;

drop policy if exists "company manage own roles" on public.roles;
create policy "company manage own roles" on public.roles
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();


-- ################################################################
-- 0015_talent_salary_and_skills.sql
-- מה זה: שכר מצופה + skills לטאלנט
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Talent compensation (private) and skills, for salary-fit tags on
-- company role pages. salary_expectation must never be rendered to
-- companies; skills are visible like other profile chips.
-- Also requested: a commute radius on talent. Still blocked on geocoding
-- (handoff item 8) — do not add a distance column here.

alter table public.talent_profiles
  add column if not exists salary_expectation int,
  add column if not exists skills text[] not null default '{}';


-- ################################################################
-- 0016_recommendations.sql
-- מה זה: המלצות על מועמדים
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- MINGLE — candidate recommendations (handoff 6.2).
-- Recommender is often not a mingle user. Public submit goes through
-- submit_recommendation (security definer) after LinkedIn OpenID.

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.users (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  recommender_name text not null,
  recommender_contact text not null,
  delivery_method text not null check (delivery_method in ('whatsapp', 'email')),
  status text not null default 'pending' check (status in ('pending', 'submitted')),
  rating int check (rating between 1 and 5),
  body text,
  recommender_linkedin_sub text,
  recommender_linkedin_name text,
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists recommendations_candidate_id_idx
  on public.recommendations (candidate_id);

alter table public.recommendations enable row level security;

drop policy if exists "candidate manage own recommendation requests" on public.recommendations;
create policy "candidate manage own recommendation requests" on public.recommendations
  for all using (auth.uid() = candidate_id) with check (auth.uid() = candidate_id);

drop policy if exists "anyone can view submitted recommendations" on public.recommendations;

create or replace function public.list_submitted_recommendations(p_candidate_id uuid)
returns table (
  id uuid,
  rating int,
  body text,
  recommender_name text
)
language sql
security definer
set search_path = public
as $$
  select
    r.id,
    r.rating,
    r.body,
    coalesce(nullif(trim(r.recommender_linkedin_name), ''), r.recommender_name)
  from public.recommendations r
  where r.candidate_id = p_candidate_id
    and r.status = 'submitted'
  order by r.submitted_at desc
$$;

grant execute on function public.list_submitted_recommendations(uuid)
  to anon, authenticated;

create or replace function public.submit_recommendation(
  p_token uuid, p_rating int, p_body text,
  p_linkedin_sub text, p_linkedin_name text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'rating must be between 1 and 5';
  end if;
  if p_linkedin_sub is null or length(trim(p_linkedin_sub)) = 0 then
    raise exception 'linkedin verification required';
  end if;

  update public.recommendations
  set rating = p_rating,
      body = left(trim(p_body), 2000),
      recommender_linkedin_sub = p_linkedin_sub,
      recommender_linkedin_name = p_linkedin_name,
      status = 'submitted',
      submitted_at = now()
  where token = p_token and status = 'pending';

  if not found then
    raise exception 'recommendation is not open';
  end if;
end;
$$;

grant execute on function public.submit_recommendation(uuid, int, text, text, text)
  to anon, authenticated;

-- Public preview for the unauthenticated /recommend/[token] page.
-- Does not expose contact details or the raw token row beyond status.
create or replace function public.recommendation_request_preview(p_token uuid)
returns table (status text, candidate_name text)
language sql
security definer
set search_path = public
as $$
  select
    r.status,
    nullif(trim(concat_ws(' ', tp.first_name, tp.last_name)), '')
  from public.recommendations r
  left join public.talent_profiles tp on tp.user_id = r.candidate_id
  where r.token = p_token
$$;

grant execute on function public.recommendation_request_preview(uuid)
  to anon, authenticated;


-- ################################################################
-- 0017_team_and_interviews.sql
-- מה זה: צוות חברה + ראיונות
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- MINGLE — company team invites and internal interview scheduling (handoff 6.4 v1).
-- No Google/Outlook columns. External calendar sync stays blocked.

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  email text not null,
  user_id uuid references public.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'hr', 'team_lead', 'member')),
  status text not null default 'invited'
    check (status in ('invited', 'active')),
  invited_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

alter table public.company_members enable row level security;

drop policy if exists "company owner manages members" on public.company_members;
create policy "company owner manages members" on public.company_members
  for all using (auth.uid() = company_id) with check (auth.uid() = company_id);

drop policy if exists "invitee claims own invite" on public.company_members;
create policy "invitee claims own invite" on public.company_members
  for update
  using (
    status = 'invited'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  )
  with check (
    user_id = auth.uid()
    and status = 'active'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  );

drop policy if exists "member reads own membership" on public.company_members;
create policy "member reads own membership" on public.company_members
  for select using (user_id = auth.uid() or company_id = auth.uid());

drop policy if exists "invitee reads own invite" on public.company_members;
create policy "invitee reads own invite" on public.company_members
  for select using (
    status = 'invited'
    and lower(email) = lower((select email from public.users where id = auth.uid()))
  );

create or replace function public.pending_company_invite()
returns table (
  id uuid,
  company_id uuid,
  company_name text,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    m.id,
    m.company_id,
    coalesce(nullif(trim(cp.company_name), ''), 'a mingle company'),
    m.role
  from public.company_members m
  left join public.company_profiles cp on cp.user_id = m.company_id
  join public.users u on u.id = auth.uid()
  where m.status = 'invited'
    and lower(m.email) = lower(u.email)
  limit 1
$$;

create or replace function public.claim_company_invite()
returns table (
  company_id uuid,
  company_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invite public.company_members%rowtype;
  actor uuid := auth.uid();
  actor_email text;
begin
  if actor is null then
    raise exception 'not signed in';
  end if;

  select email into actor_email from public.users where id = actor;
  if actor_email is null then
    raise exception 'no user row';
  end if;

  select * into invite
  from public.company_members
  where status = 'invited'
    and lower(email) = lower(actor_email)
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'no invite';
  end if;

  update public.company_members
  set user_id = actor, status = 'active'
  where id = invite.id;

  update public.users
  set user_type = 'company',
      onboarding_status = 'completed',
      onboarding_step = 4
  where id = actor;

  return query
    select
      invite.company_id,
      coalesce(
        (
          select nullif(trim(cp.company_name), '')
          from public.company_profiles cp
          where cp.user_id = invite.company_id
        ),
        'a mingle company'
      );
end;
$$;

grant execute on function public.pending_company_invite() to authenticated;
grant execute on function public.claim_company_invite() to authenticated;

create table if not exists public.interviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  connection_id uuid not null references public.connections (id) on delete cascade,
  scheduled_by uuid not null references public.users (id),
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30,
  location_type text not null default 'video'
    check (location_type in ('video', 'in_person')),
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists interviews_company_id_idx on public.interviews (company_id);
create index if not exists interviews_connection_id_idx on public.interviews (connection_id);

alter table public.interviews enable row level security;

drop policy if exists "company team manages interviews" on public.interviews;
create policy "company team manages interviews" on public.interviews
  for all
  using (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = interviews.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = interviews.company_id
        and status = 'active'
        and user_id is not null
    )
  );

drop policy if exists "candidate views own interviews" on public.interviews;
create policy "candidate views own interviews" on public.interviews
  for select
  using (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  );


-- ################################################################
-- 0018_geocoding.sql
-- מה זה: קואורדינטות מיקום (geocoding)
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- MINGLE — geocode cache columns for Discover distance (handoff 6.5).
-- Free-text location stays the source of truth. Nominatim fills these on save.

alter table public.talent_profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.company_profiles
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;


-- ################################################################
-- 0019_talent_commute.sql
-- מה זה: רדיוס נסיעה לטאלנט
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Optional commute radius on talent profiles (handoff 2026-09-09 item 19).

alter table public.talent_profiles
  add column if not exists max_commute_km int;


-- ################################################################
-- 0020_passed_profiles.sql
-- מה זה: רשימת Skip/Passed
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Passed Discover profiles (handoff 2026-09-09 B2). Owner-only list so
-- swipe-left / Skip can be undone from a real revisitable list.

create table if not exists public.passed_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  passed_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, passed_user_id)
);

alter table public.passed_profiles enable row level security;

drop policy if exists "manage own passed profiles" on public.passed_profiles;
create policy "manage own passed profiles" on public.passed_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ################################################################
-- 0021_match_feedback.sql
-- מה זה: Interested / Not a fit
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Recruiter/talent Interested and Not a fit (PRD sections 23–24).
-- One row per actor + target so a later tap can change the last action.

create table if not exists public.match_feedback (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users (id) on delete cascade,
  target_user_id uuid not null references public.users (id) on delete cascade,
  action text not null check (action in ('interested', 'not_fit')),
  reason text,
  free_text text,
  created_at timestamptz not null default now(),
  unique (actor_id, target_user_id)
);

alter table public.match_feedback enable row level security;

drop policy if exists "manage own match feedback" on public.match_feedback;
create policy "manage own match feedback" on public.match_feedback
  for all using (auth.uid() = actor_id) with check (auth.uid() = actor_id);


-- ################################################################
-- 0022_role_source_jd.sql
-- מה זה: שמירת JD גולמי על Role
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Raw pasted JD / URL on the existing roles table (no parallel jobs entity).

alter table public.roles
  add column if not exists source_jd text;

alter table public.roles
  add column if not exists source_url text;


-- ################################################################
-- 0023_match_reviews.sql
-- מה זה: ביקורות מאץ' לאדמין
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Admin match review + audit log. App-level email allow-list gates the UI.
-- Authenticated writes are allowed so the allow-listed user can record a decision.

create table if not exists public.match_reviews (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  job_title text,
  company_name text,
  candidate_name text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'flagged')),
  note text,
  overall int,
  role_fit int,
  company_fit int,
  motivation_fit int,
  confidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);

create index if not exists match_reviews_company_idx on public.match_reviews (company_id);
create index if not exists match_reviews_status_idx on public.match_reviews (status);

create table if not exists public.match_review_audit (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.match_reviews (id) on delete cascade,
  actor_id uuid not null references public.users (id) on delete cascade,
  actor_email text,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.match_reviews enable row level security;
alter table public.match_review_audit enable row level security;

drop policy if exists "authenticated manage match reviews" on public.match_reviews;
create policy "authenticated manage match reviews" on public.match_reviews
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "authenticated manage match review audit" on public.match_review_audit;
create policy "authenticated manage match review audit" on public.match_review_audit
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop trigger if exists set_match_reviews_updated_at on public.match_reviews;
create trigger set_match_reviews_updated_at
  before update on public.match_reviews
  for each row execute function public.set_updated_at();


-- ################################################################
-- 0024_pilot_learning_tables.sql
-- מה זה: טבלאות למידה לפיילוט
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Schema-only placeholders so pilot outcomes can land without a rewrite.
-- Empty except one model_versions row. No app writes, no Match Report wiring.

create table if not exists public.model_versions (
  id uuid primary key default gen_random_uuid(),
  model_name text not null,
  version text not null unique,
  embedding_model text,
  ranking_model text,
  feature_version text,
  weights_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.model_versions (
  model_name,
  version,
  ranking_model,
  feature_version,
  weights_json
)
values (
  'heuristic-overlap',
  'v1-heuristic-overlap',
  'weighted-overlap',
  'profile-signals-v1',
  '{
    "careerGoals": 20,
    "motivations": 20,
    "workStyle": 18,
    "industry": 14,
    "experience": 13,
    "location": 8,
    "companyStage": 7
  }'::jsonb
)
on conflict (version) do nothing;

create table if not exists public.match_feature_snapshots (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  features_json jsonb not null default '{}'::jsonb,
  model_version text,
  created_at timestamptz not null default now()
);

create index if not exists match_feature_snapshots_match_idx
  on public.match_feature_snapshots (match_id);

create table if not exists public.match_evidence (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  feature text,
  evidence_type text,
  source text,
  source_reference text,
  candidate_value text,
  company_value text,
  contribution numeric,
  confidence text,
  created_at timestamptz not null default now()
);

create index if not exists match_evidence_match_idx
  on public.match_evidence (match_id);

create table if not exists public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  interviewer_id uuid references public.users (id) on delete set null,
  technical_fit int,
  role_fit int,
  team_fit int,
  motivation_fit int,
  recommendation text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists interview_feedback_match_idx
  on public.interview_feedback (match_id);

create table if not exists public.employment_outcomes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid,
  hire_date date,
  day_30_status text,
  day_30_feedback text,
  day_90_status text,
  day_90_feedback text,
  retained boolean,
  satisfaction_score int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employment_outcomes_match_idx
  on public.employment_outcomes (match_id);

alter table public.model_versions enable row level security;
alter table public.match_feature_snapshots enable row level security;
alter table public.match_evidence enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.employment_outcomes enable row level security;

drop trigger if exists set_employment_outcomes_updated_at on public.employment_outcomes;
create trigger set_employment_outcomes_updated_at
  before update on public.employment_outcomes
  for each row execute function public.set_updated_at();


-- ################################################################
-- 0025_push_subscriptions.sql
-- מה זה: מנויי Push
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Web Push subscriptions. App writes own rows; related users fetch via RPC.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "manage own push subscriptions" on public.push_subscriptions;
create policy "manage own push subscriptions" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists set_push_subscriptions_updated_at on public.push_subscriptions;
create trigger set_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.list_related_push_subscriptions(p_user_id uuid)
returns table (endpoint text, p256dh text, auth text)
language sql
security definer
set search_path = public
as $$
  select s.endpoint, s.p256dh, s.auth
  from public.push_subscriptions s
  where s.user_id = p_user_id
    and (
      p_user_id = auth.uid()
      or exists (
        select 1
        from public.connections c
        where (
          (c.requester_id = auth.uid() and c.recipient_id = p_user_id)
          or (c.recipient_id = auth.uid() and c.requester_id = p_user_id)
        )
      )
      or exists (
        select 1
        from public.match_feedback f
        where (
          (f.actor_id = auth.uid() and f.target_user_id = p_user_id)
          or (f.actor_id = p_user_id and f.target_user_id = auth.uid())
        )
      )
    );
$$;

grant execute on function public.list_related_push_subscriptions(uuid) to authenticated;


-- ################################################################
-- 0026_fix_user_type_on_signup_conflict.sql
-- מה זה: תיקון: חברה לא נתקעת כ-talent
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Fix company accounts stuck as talent after signup.
-- handle_new_user previously used ON CONFLICT DO NOTHING, so a talent-default
-- row could never be corrected by a later insert attempt. When onboarding has
-- not started yet, allow the trigger conflict path to adopt the metadata type.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  meta_type text := coalesce(new.raw_user_meta_data ->> 'user_type', 'talent');
begin
  if meta_type not in ('talent', 'company') then
    meta_type := 'talent';
  end if;

  insert into public.users (id, email, user_type)
  values (new.id, new.email, meta_type)
  on conflict (id) do update
    set
      email = excluded.email,
      user_type = excluded.user_type
    where public.users.onboarding_status = 'not_started'
      and public.users.user_type is distinct from excluded.user_type;

  return new;
end;
$$;


-- ################################################################
-- 0027_rediscovered_matches.sql
-- מה זה: Rediscovery של מועמדים חמים
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Candidate rediscovery: warm prior signals re-scored for a newly opened role.

create table if not exists public.rediscovered_matches (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  candidate_id uuid not null references public.users (id) on delete cascade,
  prior_signal text not null
    check (prior_signal in ('interested', 'mutual', 'in_conversation')),
  prior_role_id uuid references public.roles (id) on delete set null,
  prior_role_title text,
  prior_at timestamptz,
  score int,
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);

create index if not exists rediscovered_matches_company_idx
  on public.rediscovered_matches (company_id);
create index if not exists rediscovered_matches_role_idx
  on public.rediscovered_matches (role_id);
create index if not exists rediscovered_matches_candidate_idx
  on public.rediscovered_matches (candidate_id);

alter table public.rediscovered_matches enable row level security;

drop policy if exists "company manage rediscovered matches" on public.rediscovered_matches;
create policy "company manage rediscovered matches"
  on public.rediscovered_matches
  for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "talent read own rediscovered matches" on public.rediscovered_matches;
create policy "talent read own rediscovered matches"
  on public.rediscovered_matches
  for select
  using (auth.uid() = candidate_id);


-- ################################################################
-- 0028_talent_birth_date.sql
-- מה זה: תאריך לידה (פרטי)
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Birth date is collected at registration for internal matching/eligibility.
-- It must not be rendered on public/shared profile surfaces.

alter table public.talent_profiles
  add column if not exists birth_date date;

comment on column public.talent_profiles.birth_date is
  'Private registration field. Not shown on the public talent profile.';


-- ################################################################
-- 0029_interview_calendar_scheduling.sql
-- מה זה: יומן ראיונות / Google Calendar
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Interview calendar: Google Calendar connect, propose 2-3 slots, talent accepts.
-- Advances relationship stage to interview_booked and optionally creates a Meet event.

alter table public.relationship_events
  drop constraint if exists relationship_events_stage_check;

alter table public.relationship_events
  add constraint relationship_events_stage_check
  check (
    stage in (
      'connected',
      'exploring',
      'in_conversation',
      'interview_booked',
      'opportunity',
      'decision',
      'relationship'
    )
  );

create table if not exists public.company_calendar_connections (
  company_id uuid primary key references public.users (id) on delete cascade,
  provider text not null default 'google' check (provider in ('google')),
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  account_email text,
  connected_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_calendar_connections enable row level security;

drop policy if exists "company manages own calendar connection"
  on public.company_calendar_connections;
create policy "company manages own calendar connection"
  on public.company_calendar_connections
  for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

create table if not exists public.interview_proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.users (id) on delete cascade,
  connection_id uuid not null references public.connections (id) on delete cascade,
  proposed_by uuid not null references public.users (id),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  duration_minutes int not null default 30
    check (duration_minutes between 15 and 180),
  location_type text not null default 'video'
    check (location_type in ('video', 'in_person')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists interview_proposals_connection_idx
  on public.interview_proposals (connection_id);

create table if not exists public.interview_proposal_slots (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null
    references public.interview_proposals (id) on delete cascade,
  starts_at timestamptz not null,
  status text not null default 'offered'
    check (status in ('offered', 'selected', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists interview_proposal_slots_proposal_idx
  on public.interview_proposal_slots (proposal_id);

alter table public.interview_proposals enable row level security;
alter table public.interview_proposal_slots enable row level security;

drop policy if exists "company manages interview proposals" on public.interview_proposals;
create policy "company manages interview proposals"
  on public.interview_proposals for all
  using (auth.uid() = company_id)
  with check (auth.uid() = company_id);

drop policy if exists "connection parties read interview proposals" on public.interview_proposals;
create policy "connection parties read interview proposals"
  on public.interview_proposals for select
  using (
    auth.uid() in (
      select requester_id from public.connections where id = connection_id
      union
      select recipient_id from public.connections where id = connection_id
    )
  );

drop policy if exists "company manages proposal slots" on public.interview_proposal_slots;
create policy "company manages proposal slots"
  on public.interview_proposal_slots for all
  using (
    exists (
      select 1 from public.interview_proposals p
      where p.id = proposal_id and p.company_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interview_proposals p
      where p.id = proposal_id and p.company_id = auth.uid()
    )
  );

drop policy if exists "connection parties read proposal slots" on public.interview_proposal_slots;
create policy "connection parties read proposal slots"
  on public.interview_proposal_slots for select
  using (
    exists (
      select 1
      from public.interview_proposals p
      join public.connections c on c.id = p.connection_id
      where p.id = proposal_id
        and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
    )
  );

alter table public.interviews
  add column if not exists google_event_id text;
alter table public.interviews
  add column if not exists meet_link text;
alter table public.interviews
  add column if not exists proposal_id uuid
    references public.interview_proposals (id) on delete set null;

create or replace function public.book_interview_from_slot(p_slot_id uuid)
returns table (
  interview_id uuid,
  company_id uuid,
  connection_id uuid,
  scheduled_at timestamptz,
  duration_minutes int,
  location_type text,
  notes text,
  talent_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  slot public.interview_proposal_slots%rowtype;
  proposal public.interview_proposals%rowtype;
  conn public.connections%rowtype;
  new_interview_id uuid;
begin
  if actor is null then
    raise exception 'not signed in';
  end if;

  select * into slot from public.interview_proposal_slots where id = p_slot_id for update;
  if not found then raise exception 'slot not found'; end if;
  if slot.status <> 'offered' then raise exception 'slot unavailable'; end if;

  select * into proposal from public.interview_proposals where id = slot.proposal_id for update;
  if not found or proposal.status <> 'pending' then raise exception 'proposal unavailable'; end if;

  select * into conn from public.connections where id = proposal.connection_id;
  if not found or conn.status <> 'accepted' then raise exception 'connection not ready'; end if;
  if actor <> conn.requester_id and actor <> conn.recipient_id then
    raise exception 'not a party to this connection';
  end if;

  update public.interview_proposal_slots set status = 'selected' where id = slot.id;
  update public.interview_proposal_slots
    set status = 'rejected'
    where proposal_id = proposal.id and id <> slot.id and status = 'offered';
  update public.interview_proposals set status = 'accepted' where id = proposal.id;

  insert into public.interviews (
    company_id, connection_id, scheduled_by, scheduled_at,
    duration_minutes, location_type, notes, status, proposal_id
  ) values (
    proposal.company_id, proposal.connection_id, actor, slot.starts_at,
    proposal.duration_minutes, proposal.location_type, proposal.notes,
    'scheduled', proposal.id
  ) returning id into new_interview_id;

  insert into public.relationship_events (connection_id, stage, actor_id, metadata)
  values (
    proposal.connection_id,
    'interview_booked',
    actor,
    jsonb_build_object(
      'interview_id', new_interview_id,
      'scheduled_at', slot.starts_at,
      'duration_minutes', proposal.duration_minutes
    )
  );

  return query select
    new_interview_id,
    proposal.company_id,
    proposal.connection_id,
    slot.starts_at,
    proposal.duration_minutes,
    proposal.location_type,
    proposal.notes,
    case when conn.requester_id = proposal.company_id then conn.recipient_id else conn.requester_id end;
end;
$$;

grant execute on function public.book_interview_from_slot(uuid) to authenticated;

create or replace function public.calendar_tokens_for_pending_proposal(p_proposal_id uuid)
returns table (
  refresh_token text,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text,
  account_email text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  proposal public.interview_proposals%rowtype;
  conn public.connections%rowtype;
begin
  if actor is null then raise exception 'not signed in'; end if;
  select * into proposal from public.interview_proposals where id = p_proposal_id;
  if not found then return; end if;
  select * into conn from public.connections where id = proposal.connection_id;
  if not found then return; end if;
  if actor <> conn.requester_id and actor <> conn.recipient_id and actor <> proposal.company_id then
    raise exception 'not allowed';
  end if;
  if proposal.status not in ('pending', 'accepted') then return; end if;
  return query
    select c.refresh_token, c.access_token, c.access_token_expires_at, c.calendar_id, c.account_email
    from public.company_calendar_connections c
    where c.company_id = proposal.company_id;
end;
$$;

grant execute on function public.calendar_tokens_for_pending_proposal(uuid) to authenticated;

drop policy if exists "connection parties update interview calendar fields" on public.interviews;
create policy "connection parties update interview calendar fields"
  on public.interviews for update
  using (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  )
  with check (
    auth.uid() in (
      select requester_id from public.connections where id = interviews.connection_id
      union
      select recipient_id from public.connections where id = interviews.connection_id
    )
  );


-- ################################################################
-- 0030_talent_github_signal.sql
-- מה זה: סיגנל GitHub לטאלנט
-- אם already exists / conflict — להמשיך הלאה
-- ################################################################

-- Optional GitHub URL + cached public metadata for soft technical signal.
-- Does not affect Role Fit axis averages; used as a separate match-report line.

alter table public.talent_profiles
  add column if not exists github_url text;

alter table public.talent_profiles
  add column if not exists github_login text;

alter table public.talent_profiles
  add column if not exists github_meta jsonb;

alter table public.talent_profiles
  add column if not exists github_fetched_at timestamptz;

