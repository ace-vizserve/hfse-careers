-- Browser log for application submissions, written by
-- lib/submission-log.server.ts. Applied with `npx supabase db push`.
--
-- Names and versions are separate columns so a report can group by browser
-- alone ("Safari") or by release ("Safari 18") without string parsing.

create table if not exists public.submission_log (
  id              bigint generated always as identity primary key,
  submitted_at    timestamptz not null default now(),

  -- Which application. The Manatal id links back to the candidate without
  -- copying their name or email into this table.
  candidate_id    text,
  job_id          text not null,
  position_name   text,

  browser_name    text,   -- Chrome, Safari, Microsoft Edge, Firefox, Samsung Internet...
  browser_version text,   -- full version as reported, e.g. 140.0.0.0
  browser_major   int,    -- 140; the useful grouping level
  os_name         text,   -- Windows, macOS, iOS, Android...
  os_version      text,
  device_type     text,   -- desktop, mobile, tablet
  in_app          text,   -- Facebook, Instagram, LinkedIn... when opened inside an app's browser, else null

  user_agent      text    -- the raw string, for anything the parse missed
);

create index if not exists submission_log_submitted_at_idx on public.submission_log (submitted_at desc);

-- RLS on with no policies: the anon key can neither read nor write, and the
-- server's service role key bypasses RLS.
alter table public.submission_log enable row level security;

-- Report views. security_invoker makes them obey the table's RLS, so they are
-- no more exposed than the table itself.

create or replace view public.submission_log_by_browser
with (security_invoker = true) as
select
  coalesce(browser_name, 'Unknown') as browser,
  browser_major,
  count(*)                          as submissions,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as percent,
  max(submitted_at)                 as last_seen
from public.submission_log
group by 1, 2
order by submissions desc;

create or replace view public.submission_log_by_platform
with (security_invoker = true) as
select
  coalesce(device_type, 'Unknown') as device,
  coalesce(os_name, 'Unknown')     as os,
  coalesce(in_app, '')             as in_app,
  count(*)                         as submissions,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as percent
from public.submission_log
group by 1, 2, 3
order by submissions desc;
