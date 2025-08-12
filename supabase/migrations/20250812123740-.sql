-- Enable necessary extensions
create extension if not exists pgcrypto;

-- Roles enum and user_roles table for RBAC
create type public.app_role as enum ('admin', 'moderator', 'user');

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function to check roles
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- Users table with RLS (profile-like table)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy if not exists "Users can view own data"
  on public.users for select
  using (auth.uid() = id);

create policy if not exists "Users can update own data"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Orders table with RLS
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  total numeric(10,2),
  status text,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy if not exists "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy if not exists "Users can create own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Products table with public read and admin-only modifications
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2),
  stock integer,
  category text,
  images jsonb,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy if not exists "Products are viewable by everyone"
  on public.products for select
  using (true);

create policy if not exists "Only admins can modify products"
  on public.products for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists update_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();