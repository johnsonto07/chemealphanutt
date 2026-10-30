-- Private bucket for notes. Files are stored as <user_id>/<session_id>/<random>.jpg|pdf
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('notes', 'notes', false, 10485760, array['image/jpeg', 'application/pdf']);

-- Members can upload only into their own folder.
create policy "members upload own notes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'notes'
    and public.is_member()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Members can read every file in the bucket (needed for signed URLs).
create policy "members read notes" on storage.objects
  for select to authenticated
  using (bucket_id = 'notes' and public.is_member());

-- Called only by the /api/submit server route (service role) after it has
-- hashed the uploaded files. All rules use the database clock.
-- p_files is a JSON array of {"path": "...", "sha256": "..."}.
create function public.create_submission(
  p_user_id uuid,
  p_session_id int,
  p_files jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.sessions;
  new_id uuid;
begin
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'Not a member';
  end if;

  select * into s from public.sessions where id = p_session_id;
  if not found then
    raise exception 'Lecture not found';
  end if;
  if s.cancelled then
    raise exception 'This lecture was cancelled';
  end if;
  if now() < s.starts_at then
    raise exception 'This lecture has not started yet';
  end if;
  if (s.starts_at at time zone 'America/Los_Angeles')::date
     <> (now() at time zone 'America/Los_Angeles')::date then
    raise exception 'Notes must be submitted on the day of the lecture';
  end if;

  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) = 0 then
    raise exception 'No files uploaded';
  end if;

  begin
    insert into public.submissions (user_id, session_id)
    values (p_user_id, p_session_id)
    returning id into new_id;
  exception when unique_violation then
    raise exception 'You already submitted notes for this lecture';
  end;

  -- Any error here aborts the whole call, so the submission row above is
  -- rolled back too.
  begin
    insert into public.submission_files (submission_id, storage_path, sha256)
    select new_id, f ->> 'path', f ->> 'sha256'
    from jsonb_array_elements(p_files) as f;
  exception when unique_violation then
    raise exception 'One of these files has been uploaded before';
  end;

  return new_id;
end;
$$;

revoke execute on function public.create_submission from public, anon, authenticated;
grant execute on function public.create_submission to service_role;
