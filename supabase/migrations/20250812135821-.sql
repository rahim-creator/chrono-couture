-- Create public storage bucket for wardrobe images
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Storage policies for wardrobe bucket
drop policy if exists "Public can read wardrobe images" on storage.objects;
create policy "Public can read wardrobe images"
  on storage.objects for select
  using (bucket_id = 'wardrobe');

drop policy if exists "Anyone can upload to wardrobe" on storage.objects;
create policy "Anyone can upload to wardrobe"
  on storage.objects for insert
  with check (bucket_id = 'wardrobe');

-- Table to store wardrobe items
create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type text not null check (type in ('haut','bas','chaussures')),
  color text not null,
  season text not null check (season in ('toutes','ete','hiver','mi-saison')),
  tags text[] not null default '{}',
  image_path text not null,
  image_url text
);

-- Enable RLS
alter table public.wardrobe_items enable row level security;

-- RLS policies (public for now)
drop policy if exists "Wardrobe items are viewable by everyone" on public.wardrobe_items;
create policy "Wardrobe items are viewable by everyone"
  on public.wardrobe_items for select
  using (true);

drop policy if exists "Anyone can insert wardrobe items" on public.wardrobe_items;
create policy "Anyone can insert wardrobe items"
  on public.wardrobe_items for insert
  with check (true);

-- Update timestamp trigger
create or replace trigger trg_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row
execute function public.update_updated_at_column();