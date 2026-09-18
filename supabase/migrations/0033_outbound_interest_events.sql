-- Outbound interest loop: click/visit events for unique outreach links.
-- Tokens are HMAC-signed in app code; this table stores attribution events.

create table if not exists public.outbound_interest_events (
  id uuid primary key default gen_random_uuid(),
  token_fingerprint text not null,
  event_type text not null check (event_type in ('click', 'visit', 'signup')),
  company text,
  contact_name text,
  contact_email text,
  open_role text,
  destination text,
  user_agent text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists outbound_interest_events_token_fp_idx
  on public.outbound_interest_events (token_fingerprint);

create index if not exists outbound_interest_events_created_idx
  on public.outbound_interest_events (created_at desc);

create index if not exists outbound_interest_events_email_idx
  on public.outbound_interest_events (contact_email);

alter table public.outbound_interest_events enable row level security;

-- No anon/authenticated policies: only service role can read/write.
comment on table public.outbound_interest_events is
  'Outbound unique-link attribution. Service-role only. Push follows only after product opt-in.';
