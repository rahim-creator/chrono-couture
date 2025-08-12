-- Storage RLS policies for private user uploads to 'wardrobe' bucket
-- Allow authenticated users to manage files within their own user-id folder

-- SELECT: users can read their own files
create policy if not exists "Users can read their own wardrobe images"
  on storage.objects
  for select
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT: users can upload into their own folder only
create policy if not exists "Users can upload their own wardrobe images"
  on storage.objects
  for insert
  with check (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE: users can update objects they own, and ensure they remain in their own folder
create policy if not exists "Users can update their own wardrobe images"
  on storage.objects
  for update
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE: users can delete their own files
create policy if not exists "Users can delete their own wardrobe images"
  on storage.objects
  for delete
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );