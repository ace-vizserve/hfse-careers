-- Applications that stopped short of Manatal, written by
-- lib/submission-log.server.ts. Applied with `npx supabase db push`.
--
-- Kept apart from submission_log on purpose: that table is who applied, this
-- one is what went wrong. A report on either never has to filter out the other.

create table if not exists public.submission_issues (
  id              bigint generated always as identity primary key,
  occurred_at     timestamptz not null default now(),

  -- failed: something broke (network, Manatal, our server, the upload).
  -- blocked: the form refused on purpose (already applied, too few references).
  outcome         text not null check (outcome in ('failed', 'blocked')),
  -- Where it stopped; the list is in lib/submission-issues.ts.
  stage           text not null,
  -- Null when the request was too broken to say which job it was for.
  job_id          text,
  http_status     int,
  -- Our own message or the browser's, never the candidate's answers.
  error           text,

  -- Same parse as submission_log, so the two tables group the same way.
  browser_name    text,
  browser_version text,
  browser_major   int,
  os_name         text,
  os_version      text,
  device_type     text,
  in_app          text,

  user_agent      text
);

create index if not exists submission_issues_occurred_at_idx on public.submission_issues (occurred_at desc);

-- RLS on with no policies: the anon key can neither read nor write, and the
-- server's service role key bypasses RLS.
alter table public.submission_issues enable row level security;

-- Report views. security_invoker makes them obey the tables' RLS.

-- What is going wrong, most frequent first.
create or replace view public.submission_issues_by_stage
with (security_invoker = true) as
select
  outcome,
  stage,
  count(*)         as issues,
  max(occurred_at) as last_seen
from public.submission_issues
group by 1, 2
order by issues desc;

-- Which browsers fail, against how many applications each one got through.
-- Only `failed` counts: a candidate told they already applied is not a
-- browser problem.
create or replace view public.submission_issues_by_browser
with (security_invoker = true) as
with failures as (
  select coalesce(browser_name, 'Unknown') as browser, browser_major, coalesce(in_app, '') as in_app,
         count(*) as failed, max(occurred_at) as last_failed
  from public.submission_issues
  where outcome = 'failed'
  group by 1, 2, 3
),
successes as (
  select coalesce(browser_name, 'Unknown') as browser, browser_major, coalesce(in_app, '') as in_app,
         count(*) as submitted
  from public.submission_log
  group by 1, 2, 3
)
select
  f.browser,
  f.browser_major,
  f.in_app,
  f.failed,
  coalesce(s.submitted, 0) as submitted,
  round(100.0 * f.failed / (f.failed + coalesce(s.submitted, 0)), 1) as failure_percent,
  f.last_failed
from failures f
left join successes s
  on s.browser = f.browser
 and s.browser_major is not distinct from f.browser_major
 and s.in_app = f.in_app
order by f.failed desc;
