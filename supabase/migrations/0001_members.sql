-- Who is allowed in. Edit rows here to change the allowlist.
create table public.allowed_emails (
  email text primary key check (email = lower(email)),
  display_name text not null,
  is_admin boolean not null default false
);

alter table public.allowed_emails enable row level security;

-- A signed-in user can see only their own allowlist row (or nothing).
create policy "read own allowlist row" on public.allowed_emails
  for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

-- One row per member, created automatically on sign-in.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  display_name text not null,
  is_admin boolean not null default false
);

alter table public.profiles enable row level security;

-- security definer runs as the table owner, so it can read profiles
-- without going through the RLS policy that calls it.
create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create policy "members read profiles" on public.profiles
  for select to authenticated
  using (public.is_member());

-- Creates the profile when an allowlisted email signs in. Runs on update too,
-- so someone added to the allowlist after a failed first sign-in gets a
-- profile the next time they sign in.
create function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, is_admin)
  select new.id, a.email, a.display_name, a.is_admin
  from public.allowed_emails a
  where a.email = lower(new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_change
  after insert or update on auth.users
  for each row execute function public.handle_auth_user();

insert into public.allowed_emails (email, display_name, is_admin) values
  ('johnson07@berkeley.edu', 'Johnson', true),
  ('lanamoraleda@berkeley.edu', 'Lana', false),
  ('genevievenm13@berkeley.edu', 'Genevieve', false);
