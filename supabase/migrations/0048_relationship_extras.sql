-- Relationship extras surfaced in the mobile app (apps/mobile): candidate
-- questions to the company ("Ask us anything"), a shared experience
-- timeline ("Experience Builder"), per-step feedback, and post-hire
-- check-ins. All four hang off public.connections and are visible only to
-- the two people on that connection — same participant rule as
-- relationship_events (0009).
--
-- "Ask us anything" is human to human (one side asks, the other answers);
-- it is NOT the AI "Mingo Q&A" that was closed on 2026-09-28.

create or replace function public.is_connection_participant(p_connection_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.connections c
    where c.id = p_connection_id
      and (c.requester_id = auth.uid() or c.recipient_id = auth.uid())
  );
$$;

-- 1. Questions ---------------------------------------------------------

create table if not exists public.connection_questions (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  asker_id uuid not null references public.users (id) on delete cascade,
  question text not null check (char_length(question) between 1 and 500),
  answer text check (answer is null or char_length(answer) between 1 and 2000),
  answered_by uuid references public.users (id) on delete set null,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists connection_questions_connection_idx
  on public.connection_questions (connection_id, created_at);

alter table public.connection_questions enable row level security;

drop policy if exists "view connection questions" on public.connection_questions;
create policy "view connection questions" on public.connection_questions
  for select using (public.is_connection_participant(connection_id));

drop policy if exists "ask connection question" on public.connection_questions;
create policy "ask connection question" on public.connection_questions
  for insert with check (
    asker_id = auth.uid()
    and answer is null
    and public.is_connection_participant(connection_id)
  );

-- Only the other side (not the asker) can answer.
drop policy if exists "answer connection question" on public.connection_questions;
create policy "answer connection question" on public.connection_questions
  for update using (
    asker_id <> auth.uid() and public.is_connection_participant(connection_id)
  ) with check (
    asker_id <> auth.uid()
    and answered_by = auth.uid()
    and public.is_connection_participant(connection_id)
  );

-- 2. Experience timeline -----------------------------------------------

create table if not exists public.connection_experiences (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  kind text not null default 'custom'
    check (kind in ('meet_manager', 'team_session', 'role_simulation', 'ask_anything', 'custom')),
  title text not null check (char_length(title) between 1 and 120),
  position integer not null default 0,
  done boolean not null default false,
  created_by uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists connection_experiences_connection_idx
  on public.connection_experiences (connection_id, position);

alter table public.connection_experiences enable row level security;

drop policy if exists "view connection experiences" on public.connection_experiences;
create policy "view connection experiences" on public.connection_experiences
  for select using (public.is_connection_participant(connection_id));

drop policy if exists "add connection experience" on public.connection_experiences;
create policy "add connection experience" on public.connection_experiences
  for insert with check (
    created_by = auth.uid() and public.is_connection_participant(connection_id)
  );

drop policy if exists "update connection experience" on public.connection_experiences;
create policy "update connection experience" on public.connection_experiences
  for update using (public.is_connection_participant(connection_id))
  with check (public.is_connection_participant(connection_id));

drop policy if exists "delete connection experience" on public.connection_experiences;
create policy "delete connection experience" on public.connection_experiences
  for delete using (
    created_by = auth.uid() and public.is_connection_participant(connection_id)
  );

-- 3. Feedback ----------------------------------------------------------

create table if not exists public.connection_feedback (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  experience_id uuid references public.connection_experiences (id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists connection_feedback_connection_idx
  on public.connection_feedback (connection_id, created_at);

alter table public.connection_feedback enable row level security;

drop policy if exists "view connection feedback" on public.connection_feedback;
create policy "view connection feedback" on public.connection_feedback
  for select using (public.is_connection_participant(connection_id));

drop policy if exists "give connection feedback" on public.connection_feedback;
create policy "give connection feedback" on public.connection_feedback
  for insert with check (
    author_id = auth.uid() and public.is_connection_participant(connection_id)
  );

-- 4. Post-hire check-ins -----------------------------------------------

create table if not exists public.post_hire_checkins (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  author_id uuid not null references public.users (id) on delete cascade,
  day_mark integer not null check (day_mark in (30, 60, 90)),
  expectations_rating integer not null check (expectations_rating between 1 and 5),
  relationship_rating integer not null check (relationship_rating between 1 and 5),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (connection_id, author_id, day_mark)
);

alter table public.post_hire_checkins enable row level security;

drop policy if exists "view post hire checkins" on public.post_hire_checkins;
create policy "view post hire checkins" on public.post_hire_checkins
  for select using (public.is_connection_participant(connection_id));

drop policy if exists "add post hire checkin" on public.post_hire_checkins;
create policy "add post hire checkin" on public.post_hire_checkins
  for insert with check (
    author_id = auth.uid() and public.is_connection_participant(connection_id)
  );
