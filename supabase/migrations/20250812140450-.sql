-- Re-apply using Postgres syntax (no IF NOT EXISTS for policies)
-- 1) Add user_id to wardrobe_items
alter table if exists public.wardrobe_items
  add column if not exists user_id uuid;

create index if not exists idx_wardrobe_items_user on public.wardrobe_items(user_id);

-- Drop existing policies to avoid name conflicts
drop policy if exists "Wardrobe items are viewable by everyone" on public.wardrobe_items;
drop policy if exists "Anyone can insert wardrobe items" on public.wardrobe_items;
drop policy if exists "Users can view their items" on public.wardrobe_items;
drop policy if exists "Users can insert their items" on public.wardrobe_items;
drop policy if exists "Users can update their items" on public.wardrobe_items;
drop policy if exists "Users can delete their items" on public.wardrobe_items;

-- Create secure policies
create policy "Users can view their items"
  on public.wardrobe_items for select
  using (auth.uid() = user_id);

create policy "Users can insert their items"
  on public.wardrobe_items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their items"
  on public.wardrobe_items for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their items"
  on public.wardrobe_items for delete
  using (auth.uid() = user_id);

-- 2) Secure storage bucket
update storage.buckets set public = false where id = 'wardrobe';

drop policy if exists "Public can read wardrobe images" on storage.objects;
drop policy if exists "Anyone can upload to wardrobe" on storage.objects;
drop policy if exists "Users can read own wardrobe files" on storage.objects;
drop policy if exists "Users can upload own wardrobe files" on storage.objects;
drop policy if exists "Users can update own wardrobe files" on storage.objects;
drop policy if exists "Users can delete own wardrobe files" on storage.objects;

create policy "Users can read own wardrobe files"
  on storage.objects for select
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can upload own wardrobe files"
  on storage.objects for insert
  with check (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own wardrobe files"
  on storage.objects for update
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own wardrobe files"
  on storage.objects for delete
  using (
    bucket_id = 'wardrobe'
    and auth.uid()::text = (storage.foldername(name))[1]
  );