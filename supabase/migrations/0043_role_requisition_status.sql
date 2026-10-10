-- Lightweight requisition tracking: Draft -> Pending approval -> Approved.
-- Defaults every existing and newly-created role to 'approved' so nothing
-- changes for teams that never touch this — it's opt-in tracking, not a
-- gate on the existing open/paused/closed lifecycle.
alter table public.roles
  add column if not exists requisition_status text
    not null default 'approved'
    check (requisition_status in ('draft', 'pending_approval', 'approved'));
