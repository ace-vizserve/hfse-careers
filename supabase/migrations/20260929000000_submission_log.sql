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

-- Upgrade a table left by the first version of this script (pasted into the
-- SQL Editor, so not in migration history): it had combined `browser`, `os`
-- and `device` labels such as "Chrome 140.0.0.0" and "Windows 10". `create
-- table if not exists` skips such a table, so add the new columns, split the
-- old labels into them, then drop the old ones. A no-op on a fresh table.
alter table public.submission_log
  add column if not exists browser_name    text,
  add column if not exists browser_version text,
  add column if not exists browser_major   int,
  add column if not exists os_name         text,
  add column if not exists os_version      text,
  add column if not exists device_type     text,
  add column if not exists in_app          text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'submission_log' and column_name = 'browser'
  ) then
    execute $upgrade$
      update public.submission_log set
        browser_name    = nullif(regexp_replace(browser, '\s+[0-9][0-9.]*$', ''), ''),
        browser_version = substring(browser from '([0-9][0-9.]*)$'),
        browser_major   = substring(browser from '([0-9]+)[0-9.]*$')::int,
        os_name         = coalesce(substring(os from '^(Windows|macOS|iOS|iPadOS|Android|Chrome OS|Linux)'), os),
        os_version      = nullif(trim(substring(os from '^(?:Windows|macOS|iOS|iPadOS|Android|Chrome OS|Linux)(.*)$')), ''),
        device_type     = device,
        -- Same patterns as IN_APP_BROWSERS in lib/submission-log.server.ts.
        in_app = case
          when user_agent ~* 'Instagram'                             then 'Instagram'
          when user_agent ~  'FBAN|FBAV|FB_IAB'                      then 'Facebook'
          when user_agent ~* 'LinkedInApp'                           then 'LinkedIn'
          when user_agent ~* 'musical_ly|BytedanceWebview|TikTok'    then 'TikTok'
          when user_agent ~* 'MicroMessenger'                        then 'WeChat'
          when user_agent ~  '\mLine/'                               then 'LINE'
          when user_agent ~  '\mGSA/'                                then 'Google app'
        end
      where browser_name is null
    $upgrade$;

    alter table public.submission_log
      drop column browser,
      drop column os,
      drop column device;
  end if;
end $$;

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
