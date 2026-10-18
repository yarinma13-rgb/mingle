-- Campaign-level attribution. 0041 stored only the channel and the raw
-- utm_source; utm_campaign lived solely on the PostHog person, so the admin
-- growth dashboard could not answer "which campaign brought activated users".
-- Applies to new signups only; existing rows stay null.

alter table public.users
  add column if not exists acquisition_campaign text;

comment on column public.users.acquisition_campaign is
  'Raw first-touch utm_campaign captured at signup (null for pre-0049 users and untagged traffic).';
