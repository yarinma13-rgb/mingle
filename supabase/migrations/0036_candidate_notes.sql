-- Candidate notes/tags: one freeform note + tag list per connection, shared
-- by the whole company team (same "team workspace" RLS model as 0035).

create table if not exists public.candidate_notes (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.connections (id) on delete cascade,
  company_id uuid not null references public.users (id) on delete cascade,
  notes text not null default '',
  tags text[] not null default '{}',
  updated_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id)
);

create index if not exists candidate_notes_company_id_idx
  on public.candidate_notes (company_id);

alter table public.candidate_notes enable row level security;

drop policy if exists "team workspace manages candidate notes" on public.candidate_notes;
create policy "team workspace manages candidate notes" on public.candidate_notes
  for all
  using (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = candidate_notes.company_id
        and status = 'active'
        and user_id is not null
    )
  )
  with check (
    auth.uid() = company_id
    or auth.uid() in (
      select user_id from public.company_members
      where company_id = candidate_notes.company_id
        and status = 'active'
        and user_id is not null
    )
  );

drop trigger if exists set_candidate_notes_updated_at on public.candidate_notes;
create trigger set_candidate_notes_updated_at
  before update on public.candidate_notes
  for each row execute function public.set_updated_at();
