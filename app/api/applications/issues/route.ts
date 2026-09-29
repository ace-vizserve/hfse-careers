// app/api/applications/issues/route.ts

import { CLIENT_ISSUE_STAGES, ISSUE_ERROR_MAX, isClientIssueStage, isSessionId } from "@/lib/submission-issues";
import { logIssue } from "@/lib/submission-log.server";

/**
 * Where the apply page reports what the server could not have seen: a request
 * that never arrived, a reply that was not ours, an upload to Supabase that
 * failed, and the form's own refusals.
 *
 * Anyone can call this, so it takes only a known stage, derives the outcome
 * from it rather than trusting the caller, and caps the message. The worst a
 * caller can do is add a row that says a stage failed.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const { jobId, sessionId, stage, error } = (body ?? {}) as Record<string, unknown>;

  if (!isClientIssueStage(stage)) {
    return new Response(null, { status: 400 });
  }

  await logIssue(request, {
    stage,
    outcome: CLIENT_ISSUE_STAGES[stage],
    jobId: typeof jobId === "string" && /^\d{1,12}$/.test(jobId) ? jobId : null,
    error: typeof error === "string" ? error.slice(0, ISSUE_ERROR_MAX) : null,
    // A beacon cannot carry headers, so the session comes in the body.
    sessionId: isSessionId(sessionId) ? sessionId : null,
  });

  return new Response(null, { status: 204 });
}
