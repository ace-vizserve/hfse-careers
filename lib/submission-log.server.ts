/**
 * Server-only log of which browser each application was submitted from, and of
 * the applications that did not make it (`logIssue`).
 *
 * One row per successful submission goes to the `careers_submission_log` table in
 * Supabase (see supabase/migrations/20260929000000_submission_log.sql), read in the Table Editor. It
 * holds the Manatal candidate id rather than the candidate's details, so the
 * log itself carries no personal data beyond the browser string.
 *
 * Writing needs the service role key: the anon key ships in the client bundle,
 * so a table it can insert into is one anyone can fill.
 */

import { createClient } from "@supabase/supabase-js";
import Bowser from "bowser";
import { ISSUE_ERROR_MAX, type IssueStage, isSessionId, SESSION_HEADER, type SubmissionOutcome } from "./submission-issues";

type SubmissionLogEntry = {
  candidateId: number | string | null;
  jobId: string;
  positionName: string | null;
};

/**
 * Apps that open links in their own browser. Job posts get shared on these, and
 * their in-app browsers are where uploads and saved drafts most often misbehave,
 * so they are worth telling apart from the browser underneath.
 */
const IN_APP_BROWSERS: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB/, "Facebook"],
  [/LinkedInApp/i, "LinkedIn"],
  [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
  [/MicroMessenger/i, "WeChat"],
  [/\bLine\//, "LINE"],
  [/\bGSA\//, "Google app"],
];

export function readBrowser(userAgent: string) {
  const parsed = Bowser.parse(userAgent);
  const major = Number.parseInt(parsed.browser.version ?? "", 10);

  return {
    browser_name: parsed.browser.name ?? null,
    browser_version: parsed.browser.version ?? null,
    browser_major: Number.isNaN(major) ? null : major,
    os_name: parsed.os.name ?? null,
    os_version: parsed.os.version ?? null,
    device_type: parsed.platform.type ?? null,
    in_app: IN_APP_BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null,
  };
}

/**
 * Records the submission. The candidate is already in Manatal by the time this
 * runs, so a failure is logged and swallowed, never reported as a failed
 * application.
 */
export async function logSubmission(request: Request, entry: SubmissionLogEntry) {
  await insertRow("careers_submission_log", request, {
    candidate_id: entry.candidateId == null ? null : String(entry.candidateId),
    job_id: entry.jobId,
    position_name: entry.positionName,
  });
}

type IssueEntry = {
  stage: IssueStage;
  outcome: Exclude<SubmissionOutcome, "submitted">;
  jobId: string | null;
  httpStatus?: number | null;
  error?: string | null;
  /** Defaults to the session header the apply page sends on its requests. */
  sessionId?: string | null;
};

/**
 * Records an application that stopped short of Manatal, in `careers_submission_issues`
 * (supabase/migrations/20260929010000_submission_issues.sql). Called on the way
 * out of an error, so like `logSubmission` it never throws: the candidate should
 * see the error they hit, not one from the log.
 */
export async function logIssue(request: Request, entry: IssueEntry) {
  const sessionId = entry.sessionId ?? request.headers.get(SESSION_HEADER);

  await insertRow("careers_submission_issues", request, {
    session_id: isSessionId(sessionId) ? sessionId : null,
    outcome: entry.outcome,
    stage: entry.stage,
    job_id: entry.jobId,
    http_status: entry.httpStatus ?? null,
    error: entry.error ? entry.error.slice(0, ISSUE_ERROR_MAX) : null,
  });
}

/** A Supabase client on the service role key, or null when it is not configured. */
export function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * The browser columns every log table shares. The raw string is kept alongside
 * the parse, since browsers now trim it and the parse can miss.
 */
export function browserColumns(request: Request) {
  const userAgent = request.headers.get("user-agent");
  return { ...(userAgent ? readBrowser(userAgent) : {}), user_agent: userAgent };
}

async function insertRow(table: string, request: Request, row: Record<string, unknown>) {
  const supabase = serviceClient();

  if (!supabase) {
    console.error(`${table} skipped: SUPABASE_SERVICE_ROLE_KEY is not configured`);
    return;
  }

  try {
    const { error } = await supabase.from(table).insert({ ...row, ...browserColumns(request) });

    if (error) console.error(`${table} insert failed:`, error.message);
  } catch (logError) {
    console.error(`${table} insert threw:`, logError);
  }
}
