-- Company subscriptions (Stripe). One row per company workspace. Written ONLY
-- by the Stripe webhook / server routes using the service role — there are
-- deliberately no insert/update/delete policies, so a company can never grant
-- itself a plan from the client. Companies (owner + active team members) can
-- read their own row.

create table if not exists public.company_subscriptions (
  company_id uuid primary key references public.users (id) on delete cascade,
  plan text not null check (plan in ('core', 'plus', 'max')),
  status text not null
    check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  billing_country text,
  currency text,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  grandfathered boolean not null default false,
  needs_review boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.company_subscriptions enable row level security;

drop policy if exists "company reads own subscription" on public.company_subscriptions;
create policy "company reads own subscription" on public.company_subscriptions
  for select
  using (public.is_match_company_side(company_id));

drop trigger if exists set_company_subscriptions_updated_at on public.company_subscriptions;
create trigger set_company_subscriptions_updated_at
  before update on public.company_subscriptions
  for each row execute function public.set_updated_at();

-- Webhook idempotency: Stripe retries and may deliver an event twice.
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;

-- Every company that exists TODAY keeps working for free (grandfathered,
-- Max-equivalent limits) until the product owner decides otherwise. Companies
-- that sign up after this runs have no row and go through /billing/start.
insert into public.company_subscriptions (company_id, plan, status, grandfathered)
select id, 'max', 'active', true
from public.users
where user_type = 'company'
on conflict (company_id) do nothing;
