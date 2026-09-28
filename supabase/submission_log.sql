-- Browser log for application submissions, written by
-- lib/submission-log.server.ts. Run once in the Supabase SQL Editor.

create table if not exists public.submission_log (
  id            bigint generated always as identity primary key,
  submitted_at  timestamptz not null default now(),
  candidate_id  text,
  job_id        text not null,
  position_name text,
  browser       text,
  os            text,
  device        text,
  user_agent    text
);

-- RLS on with no policies: the anon key can neither read nor write, and the
-- server's service role key bypasses RLS.
alter table public.submission_log enable row level security;
