-- MINGLE — talent CV / portfolio file (PRODUCT_SPEC.md screen 6:
-- optional CV upload, supplementary, not the center of the experience).
--
-- Private Storage bucket plus two columns on talent_profiles so the UI
-- can show the original file name without listing the bucket. Do not
-- make this bucket public: signed URLs are created only for viewers who
-- can already read the talent profile row (same rule as
-- "authenticated can view talent profiles").

alter table public.talent_profiles
  add column if not exists cv_path text;

alter table public.talent_profiles
  add column if not exists cv_file_name text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'talent-cvs',
  'talent-cvs',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "talent upload own cv" on storage.objects;
create policy "talent upload own cv"
  on storage.objects
  for insert
  with check (
    bucket_id = 'talent-cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "talent update own cv" on storage.objects;
create policy "talent update own cv"
  on storage.objects
  for update
  using (
    bucket_id = 'talent-cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'talent-cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "talent delete own cv" on storage.objects;
create policy "talent delete own cv"
  on storage.objects
  for delete
  using (
    bucket_id = 'talent-cvs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "view talent cv if profile visible" on storage.objects;
create policy "view talent cv if profile visible"
  on storage.objects
  for select
  using (
    bucket_id = 'talent-cvs'
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.talent_profiles tp
      where tp.user_id::text = (storage.foldername(name))[1]
    )
  );
