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
