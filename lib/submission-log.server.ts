/**
 * Server-only log of which browser each application was submitted from.
 *
 * One row per successful submission goes to the `submission_log` table in
 * Supabase (see supabase/submission_log.sql), read in the Table Editor. It
 * holds the Manatal candidate id rather than the candidate's details, so the
 * log itself carries no personal data beyond the browser string.
 *
 * Writing needs the service role key: the anon key ships in the client bundle,
 * so a table it can insert into is one anyone can fill.
 */

import { createClient } from "@supabase/supabase-js";
import Bowser from "bowser";

type SubmissionLogEntry = {
  candidateId: number | string | null;
  jobId: string;
  positionName: string | null;
};

function readBrowser(userAgent: string) {
  const parsed = Bowser.parse(userAgent);
  const label = (name?: string, version?: string) => (name ? [name, version].filter(Boolean).join(" ") : null);

  return {
    browser: label(parsed.browser.name, parsed.browser.version),
    os: label(parsed.os.name, parsed.os.versionName ?? parsed.os.version),
    device: parsed.platform.type ?? null,
  };
}

/**
 * Records the submission. The candidate is already in Manatal by the time this
 * runs, so a failure is logged and swallowed, never reported as a failed
 * application.
 */
export async function logSubmission(request: Request, entry: SubmissionLogEntry) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Submission log skipped: SUPABASE_SERVICE_ROLE_KEY is not configured");
    return;
  }

  // The raw string is kept alongside the parse, since browsers now trim it and
  // the parse can miss.
  const userAgent = request.headers.get("user-agent");

  try {
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { error } = await supabase.from("submission_log").insert({
      candidate_id: entry.candidateId == null ? null : String(entry.candidateId),
      job_id: entry.jobId,
      position_name: entry.positionName,
      ...(userAgent ? readBrowser(userAgent) : {}),
      user_agent: userAgent,
    });

    if (error) console.error("Submission log insert failed:", error.message);
  } catch (logError) {
    console.error("Submission log threw:", logError);
  }
}
