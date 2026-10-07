// app/api/applications/report/route.ts

import { isSessionId } from "@/lib/submission-issues";
import { browserColumns, serviceClient } from "@/lib/submission-log.server";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

/**
 * A problem report from the apply page's "Report a problem" form. Saved to
 * `careers_problem_reports` (supabase/migrations/20260929020000_problem_reports.sql)
 * with the visit's session id, which is what lines it up with the failures
 * logged in `careers_submission_issues`. Support reads them in `careers_problem_reports_open`.
 *
 * The candidate is told they were heard only once the row exists.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;

  try {
    body = (await request.json()) ?? {};
  } catch {
    return Response.json({ error: "Invalid report" }, { status: 400 });
  }

  // A field no person sees. A bot filling every input fills this one too, and
  // is told it succeeded so it has no reason to try again.
  if (text(body.website, 200)) {
    return Response.json({ id: null });
  }

  const name = text(body.name, 200);
  const email = text(body.email, 320);
  const message = text(body.message, MESSAGE_MAX);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address so we can reply." }, { status: 400 });
  }

  if (message.length < MESSAGE_MIN) {
    return Response.json({ error: "Please tell us a little more about what happened." }, { status: 400 });
  }

  const supabase = serviceClient();

  if (!supabase) {
    console.error("Problem report not saved: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return Response.json({ error: "Reports cannot be received right now." }, { status: 503 });
  }

  const jobId = text(body.jobId, 12);
  const sessionId = isSessionId(body.sessionId) ? body.sessionId : null;
  const browser = browserColumns(request);

  const row = {
    session_id: sessionId,
    job_id: /^\d+$/.test(jobId) ? jobId : null,
    position_name: text(body.positionName, 200) || null,
    name: name || null,
    email,
    message,
    step: text(body.step, 100) || null,
    shown_error: text(body.shownError, 500) || null,
    ...browser,
  };

  const { data, error } = await supabase.from("careers_problem_reports").insert(row).select("id").single();

  if (error || !data) {
    console.error("Problem report insert failed:", error?.message);
    return Response.json({ error: "Your report could not be saved." }, { status: 500 });
  }

  return Response.json({ id: data.id });
}
