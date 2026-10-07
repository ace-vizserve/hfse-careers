-- Prefix the careers portal's tables and views with `careers_`, so they read
-- as this app's in a Supabase project shared with others. Applied with
-- `npx supabase db push`.
--
-- Renames keep the rows, identity sequences, RLS settings and grants. Views
-- point at tables by oid, so they follow the rename on their own; they are
-- renamed here only to match. Indexes, keys and constraints are renamed too,
-- so nothing is left under the old names.
--
-- Deploy the code that uses the new names straight after: until then the
-- running app writes to tables that no longer exist, and those writes fail
-- quietly (lib/submission-log.server.ts logs and moves on).

-- Tables
alter table public.submission_log    rename to careers_submission_log;
alter table public.submission_issues rename to careers_submission_issues;
alter table public.problem_reports   rename to careers_problem_reports;

-- Views
alter view public.submission_log_by_browser    rename to careers_submission_log_by_browser;
alter view public.submission_log_by_platform   rename to careers_submission_log_by_platform;
alter view public.submission_issues_by_stage   rename to careers_submission_issues_by_stage;
alter view public.submission_issues_by_browser rename to careers_submission_issues_by_browser;
alter view public.problem_reports_open         rename to careers_problem_reports_open;

-- Indexes, primary keys included
alter index public.submission_log_pkey               rename to careers_submission_log_pkey;
alter index public.submission_log_submitted_at_idx   rename to careers_submission_log_submitted_at_idx;
alter index public.submission_issues_pkey            rename to careers_submission_issues_pkey;
alter index public.submission_issues_occurred_at_idx rename to careers_submission_issues_occurred_at_idx;
alter index public.submission_issues_session_idx     rename to careers_submission_issues_session_idx;
alter index public.problem_reports_pkey              rename to careers_problem_reports_pkey;
alter index public.problem_reports_reported_at_idx   rename to careers_problem_reports_reported_at_idx;

-- Check constraint on outcome
alter table public.careers_submission_issues
  rename constraint submission_issues_outcome_check to careers_submission_issues_outcome_check;

-- Identity sequences
alter sequence public.submission_log_id_seq    rename to careers_submission_log_id_seq;
alter sequence public.submission_issues_id_seq rename to careers_submission_issues_id_seq;
alter sequence public.problem_reports_id_seq   rename to careers_problem_reports_id_seq;
