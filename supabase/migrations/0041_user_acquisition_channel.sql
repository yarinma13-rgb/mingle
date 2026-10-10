-- Acquisition channel attribution. Before this, UTM data only ever reached
-- the PostHog person (identifyUser in lib/analytics/track.ts) — nothing was
-- stored on the user row, and there was no mapping from raw utm_source
-- strings to one of the named channels the founder actually thinks in
-- (LinkedIn / Instagram / Facebook / Referral / Company outreach /
-- Organic-SEO / Direct). This also unifies the two already-working but
-- siloed attribution mechanisms (outbound_interest_events, role_referrals)
-- into the same field instead of three separate places to look.

alter table public.users
  add column if not exists acquisition_channel text
    check (acquisition_channel in (
      'linkedin', 'instagram', 'facebook', 'referral',
      'company_outreach', 'organic', 'direct', 'other'
    )),
  add column if not exists acquisition_source_raw text;

comment on column public.users.acquisition_channel is
  'Categorized signup channel, mapped once at signup from UTM params / outbound / referral context.';
comment on column public.users.acquisition_source_raw is
  'Raw utm_source (or equivalent) string the channel was mapped from, kept for debugging.';
