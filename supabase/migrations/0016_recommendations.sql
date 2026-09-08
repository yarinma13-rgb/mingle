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
