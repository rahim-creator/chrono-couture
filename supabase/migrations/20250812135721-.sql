-- Create public storage bucket for wardrobe images
insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

-- Public read access to wardrobe bucket
create policy if not exists "Public can read wardrobe images"
  on storage.objects for select
  using (bucket_id = 'wardrobe');

-- Allow anyone to upload to wardrobe bucket (no auth yet)
create policy if not exists "Anyone can upload to wardrobe"
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
  -- Optional cached public URL for convenience
  image_url text
);

-- Enable RLS
alter table public.wardrobe_items enable row level security;

-- Public read
create policy if not exists "Wardrobe items are viewable by everyone"
  on public.wardrobe_items for select
  using (true);

-- Public insert (no auth yet) - we'll tighten later when auth is added
create policy if not exists "Anyone can insert wardrobe items"
  on public.wardrobe_items for insert
  with check (true);

-- Update timestamp trigger
create or replace trigger trg_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row
execute function public.update_updated_at_column();