/**
 * Where an application stopped short of Manatal, shared by the server log and
 * the page that reports what only the browser sees.
 *
 * A `blocked` stage is the form refusing on purpose (already applied, too few
 * references); a `failed` one is something going wrong. Keeping them apart lets
 * a report show real breakage without the candidates who simply got told no.
 */

export type SubmissionOutcome = "submitted" | "failed" | "blocked";

/** Stages only the server reaches, logged from the route that hit them. */
export type ServerIssueStage = "config" | "payload" | "nationality" | "manatal";

/**
 * Stages the page reports. The server logs its own failures, so the page only
 * reports what the server never saw: a request that did not arrive, a reply that
 * was not ours (a platform timeout page), and the form's own refusals.
 */
export const CLIENT_ISSUE_STAGES = {
  duplicate_check: "failed",
  submit: "failed",
  resume_upload: "failed",
  already_applied: "blocked",
  references: "blocked",
  resume: "blocked",
} as const satisfies Record<string, SubmissionOutcome>;

export type ClientIssueStage = keyof typeof CLIENT_ISSUE_STAGES;

export type IssueStage = ServerIssueStage | ClientIssueStage;

export const isClientIssueStage = (value: unknown): value is ClientIssueStage =>
  typeof value === "string" && Object.hasOwn(CLIENT_ISSUE_STAGES, value);

/**
 * One id per visit to the apply page, sent on every request it makes. It is
 * what ties a candidate's problem report to the failures logged for the same
 * visit, without the logs having to hold their name.
 */
export const SESSION_HEADER = "x-application-session";

export function newSessionId() {
  // randomUUID needs Safari 15.4+; an older browser still gets an id unique
  // enough to join on.
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const isSessionId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-z-]{8,64}$/i.test(value);

/** Long enough for a browser's error, short enough that the column stays a label. */
export const ISSUE_ERROR_MAX = 300;

/**
 * Tells the server about a problem it could not have seen. `sendBeacon` is used
 * because it survives the candidate closing the tab on an error; `fetch` with
 * `keepalive` is the fallback. Never throws: a report that fails to send must
 * not add a second error to the one the candidate is already looking at.
 */
export function reportSubmissionIssue(issue: {
  jobId: string;
  sessionId: string;
  stage: ClientIssueStage;
  error?: unknown;
}) {
  try {
    const body = JSON.stringify({
      jobId: issue.jobId,
      sessionId: issue.sessionId,
      stage: issue.stage,
      error: describeError(issue.error),
    });

    // A plain string goes as text/plain, which every browser's sendBeacon
    // accepts; a Blob typed application/json was refused by some Chrome
    // releases. The route parses the body as JSON either way.
    if (navigator.sendBeacon?.("/api/applications/issues", body)) return;

    void fetch("/api/applications/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Nothing else to do from here.
  }
}

function describeError(error: unknown) {
  if (error == null) return undefined;
  if (error instanceof Error) {
    // "TypeError: Load failed" says more than "Load failed" alone: the name is
    // what separates a network drop from a code error.
    return `${error.name}: ${error.message}`.slice(0, ISSUE_ERROR_MAX);
  }
  return String(error).slice(0, ISSUE_ERROR_MAX);
}
