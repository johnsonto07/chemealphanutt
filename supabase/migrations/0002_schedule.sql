create table public.courses (
  id serial primary key,
  code text not null unique,
  name text not null
);

create table public.sessions (
  id serial primary key,
  course_id int not null references public.courses (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  cancelled boolean not null default false,
  unique (course_id, starts_at)
);

create index sessions_starts_at_idx on public.sessions (starts_at);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  session_id int not null references public.sessions (id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'accepted' check (status in ('accepted', 'rejected')),
  rejected_by uuid references public.profiles (id),
  reject_reason text,
  rejected_at timestamptz,
  unique (user_id, session_id)
);

create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  storage_path text not null unique,
  sha256 text not null unique,
  created_at timestamptz not null default now()
);

alter table public.courses enable row level security;
alter table public.sessions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;

-- Members can read everything. There are no insert/update/delete policies:
-- writes go through server routes and security definer functions added in
-- milestones 3 and 5, which enforce the time window and duplicate rules.
create policy "members read courses" on public.courses
  for select to authenticated using (public.is_member());
create policy "members read sessions" on public.sessions
  for select to authenticated using (public.is_member());
create policy "members read submissions" on public.submissions
  for select to authenticated using (public.is_member());
create policy "members read submission files" on public.submission_files
  for select to authenticated using (public.is_member());

-- Creates one session per matching day between from_date and to_date.
-- weekdays uses ISO numbering: 1 = Monday ... 7 = Sunday.
-- Times are Berkeley local time; the conversion to UTC handles daylight saving.
-- Safe to run twice: existing sessions are skipped.
create function public.generate_sessions(
  course_code text,
  weekdays int[],
  start_time time,
  end_time time,
  from_date date,
  to_date date,
  skip_dates date[] default '{}'
)
returns int
language plpgsql
set search_path = ''
as $$
declare
  inserted int;
begin
  insert into public.sessions (course_id, starts_at, ends_at)
  select
    c.id,
    (d::date + start_time) at time zone 'America/Los_Angeles',
    (d::date + end_time) at time zone 'America/Los_Angeles'
  from public.courses c
  cross join generate_series(from_date, to_date, interval '1 day') as d
  where c.code = course_code
    and extract(isodow from d)::int = any (weekdays)
    and not (d::date = any (skip_dates))
  on conflict (course_id, starts_at) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- Only the SQL Editor (postgres role) should generate sessions.
revoke execute on function public.generate_sessions from public, anon, authenticated;

-- Today's lectures in Berkeley time. security_invoker makes the view obey
-- the RLS policies of the person querying it.
create view public.sessions_today with (security_invoker = true) as
select s.id, s.starts_at, s.ends_at, s.cancelled, c.code as course_code
from public.sessions s
join public.courses c on c.id = s.course_id
where (s.starts_at at time zone 'America/Los_Angeles')::date
    = (now() at time zone 'America/Los_Angeles')::date
order by s.starts_at;
