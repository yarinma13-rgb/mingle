-- Allow followup_sent event type for one-time auto email after interest click.

alter table public.outbound_interest_events
  drop constraint if exists outbound_interest_events_event_type_check;

alter table public.outbound_interest_events
  add constraint outbound_interest_events_event_type_check
  check (event_type in ('click', 'visit', 'signup', 'followup_sent'));
