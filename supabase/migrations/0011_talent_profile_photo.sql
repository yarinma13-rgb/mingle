-- MINGLE — talent profile photo (optional, same storage pattern as
-- 0010 talent CVs). Private bucket; signed URLs only. The existing
-- talent_profiles.profile_photo column stores the object path
-- ({user_id}/photo), not a public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'talent-profile-photos',
  'talent-profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "talent upload own photo" on storage.objects;
create policy "talent upload own photo"
  on storage.objects
  for insert
  with check (
    bucket_id = 'talent-profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "talent update own photo" on storage.objects;
create policy "talent update own photo"
  on storage.objects
  for update
  using (
    bucket_id = 'talent-profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'talent-profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "talent delete own photo" on storage.objects;
create policy "talent delete own photo"
  on storage.objects
  for delete
  using (
    bucket_id = 'talent-profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "view talent photo if profile visible" on storage.objects;
create policy "view talent photo if profile visible"
  on storage.objects
  for select
  using (
    bucket_id = 'talent-profile-photos'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.talent_profiles tp
      where tp.user_id::text = (storage.foldername(name))[1]
    )
  );
