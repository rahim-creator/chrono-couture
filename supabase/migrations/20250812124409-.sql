-- Harden has_role with fixed search_path and keep full qualification
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- RLS policies for user_roles
alter table public.user_roles enable row level security;

drop policy if exists "Users can view own roles" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Admins can manage roles" on public.user_roles;

-- Users can only see their own roles
create policy "Users can view own roles"
  on public.user_roles
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can view all roles
create policy "Admins can view all roles"
  on public.user_roles
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Admins can insert/update/delete roles
create policy "Admins can manage roles"
  on public.user_roles
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Optional: allow service role complete access (implicit bypass)
-- (No changes needed; service role bypasses RLS)