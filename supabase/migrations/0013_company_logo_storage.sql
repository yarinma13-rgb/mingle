-- MINGLE — company logo storage. Public bucket (logos are shown to
-- candidates and on public-facing surfaces), unlike the private
-- talent-cv / talent-profile-photo buckets in 0010/0011.
--
-- components/CompanyProfileWizard.tsx uploads to bucket "logos" and
-- calls getPublicUrl() — this bucket did not exist yet, which is why
-- every upload silently failed and fell back to the "skip for now"
-- error message.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'logos',
  'logos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "company upload own logo" on storage.objects;
create policy "company upload own logo"
  on storage.objects
  for insert
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "company update own logo" on storage.objects;
create policy "company update own logo"
  on storage.objects
  for update
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "company delete own logo" on storage.objects;
create policy "company delete own logo"
  on storage.objects
  for delete
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No select policy needed: the bucket is public, so storage.objects
-- reads for it are served without auth by Supabase's public bucket path.
