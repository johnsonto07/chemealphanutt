-- Run this once in the Supabase SQL Editor, after 0002_schedule.sql.

insert into public.courses (code, name) values
  ('CBE 130', 'Mathematics and Statistics in Chemical Engineering'),
  ('CBE 140', 'Introduction to Chemical Process Analysis')
on conflict (code) do nothing;

-- TODO(Johnson): generate the lecture sessions.
-- Write one "select public.generate_sessions(...);" per course. Arguments, in order:
--   course_code  'CBE 130' or 'CBE 140' (must match the insert above)
--   weekdays     array of ISO weekday numbers, 1 = Mon ... 7 = Sun. MWF is array[1,3,5]
--   start_time   lecture start in Berkeley time, e.g. '10:10'
--   end_time     lecture end, e.g. '11:00'
--   from_date    first day that counts toward the quota
--   to_date      '2026-12-11', the last day of instruction
--   skip_dates   no-lecture days, as an array of dates:
--                array['2026-09-07', '2026-11-11', '2026-11-26', '2026-11-27']::date[]
-- Each call returns how many sessions it created. Running it twice is harmless.

-- Check the result: should list each course with its session count and date range.
select c.code, count(*) as sessions,
       min(s.starts_at at time zone 'America/Los_Angeles') as first,
       max(s.starts_at at time zone 'America/Los_Angeles') as last
from public.sessions s join public.courses c on c.id = s.course_id
group by c.code;
