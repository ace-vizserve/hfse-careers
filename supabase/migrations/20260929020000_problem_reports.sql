-- Problems candidates report from the apply page, written by
-- lib/problem-report.server.ts. Applied with `npx supabase db push`.
--
-- A report and the failures logged for the same visit share a session_id, so
-- support can read what the candidate said next to what actually went wrong:
--
--   select * from submission_issues where session_id = '<from the report>';

alter table public.submission_issues add column if not exists session_id text;
create index if not exists submission_issues_session_idx on public.submission_issues (session_id);

create table if not exists public.problem_reports (
  id              bigint generated always as identity primary key,
  reported_at     timestamptz not null default now(),

  -- One per visit to the apply page; the key into submission_issues.
  session_id      text,
  job_id          text,
  position_name   text,

  -- Who to reply to. Unlike the two logs, this holds personal data: the
  -- candidate typed it in so that someone would write back.
  name            text,
  email           text not null,
  message         text not null,

  -- What the page was showing when they opened the form.
  step            text,
  shown_error     text,

  -- Worked through by support; null until someone picks it up.
  resolved_at     timestamptz,

  browser_name    text,
  browser_version text,
  browser_major   int,
  os_name         text,
  os_version      text,
  device_type     text,
  in_app          text,
  user_agent      text
);

create index if not exists problem_reports_reported_at_idx on public.problem_reports (reported_at desc);

-- RLS on with no policies: only the server's service role key reaches it.
alter table public.problem_reports enable row level security;

-- The open reports, each with how many failures its visit logged and the
-- latest one, so the likely cause is on the same line as the complaint.
create or replace view public.problem_reports_open
with (security_invoker = true) as
select
  r.id,
  r.reported_at,
  r.name,
  r.email,
  r.position_name,
  r.message,
  r.shown_error,
  r.step,
  concat_ws(' ', r.browser_name, r.browser_major::text) as browser,
  concat_ws(' ', r.os_name, r.device_type)              as platform,
  r.in_app,
  count(i.id)                                            as logged_issues,
  (array_agg(i.stage || ': ' || coalesce(i.error, '') order by i.occurred_at desc)
     filter (where i.id is not null))[1]                 as latest_issue,
  r.session_id
from public.problem_reports r
left join public.submission_issues i on i.session_id = r.session_id
where r.resolved_at is null
group by r.id
order by r.reported_at desc;
