-- Run this once in the Supabase SQL Editor, after 0002_schedule.sql.

insert into public.courses (code, name) values
  ('CBE 130', 'Mathematics and Statistics in Chemical Engineering'),
  ('CBE 140', 'Introduction to Chemical Process Analysis'),
  ('CHEM 12A', 'Organic Chemistry')
on conflict (code) do nothing;

-- Arguments: course, ISO weekdays (1 = Mon ... 7 = Sun), start, end (Berkeley time),
-- first day counted, last day of instruction, no-lecture days.
-- Running this file twice is harmless: existing sessions are skipped.
select public.generate_sessions('CBE 130', array[1,3,5], '11:00', '12:00',
  '2026-11-02', '2026-12-11', array['2026-11-11', '2026-11-26', '2026-11-27']::date[]);

select public.generate_sessions('CBE 140', array[1,3,5], '09:00', '10:00',
  '2026-11-02', '2026-12-11', array['2026-11-11', '2026-11-26', '2026-11-27']::date[]);

select public.generate_sessions('CHEM 12A', array[2,4], '08:00', '09:30',
  '2026-11-02', '2026-12-11', array['2026-11-11', '2026-11-26', '2026-11-27']::date[]);

-- Check the result: should list each course with its session count and date range.
select c.code, count(*) as sessions,
       min(s.starts_at at time zone 'America/Los_Angeles') as first,
       max(s.starts_at at time zone 'America/Los_Angeles') as last
from public.sessions s join public.courses c on c.id = s.course_id
group by c.code;
