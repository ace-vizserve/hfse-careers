import { getJobSectionFields } from "@/lib/jobs.server";
import { buildIncompleteProbe, readValueProblems } from "@/lib/forms/manatal-probe";

/**
 * Ask Manatal whether the answers on one step are acceptable, before the
 * candidate moves on.
 *
 * Manatal validates an application only at submission and reports the first
 * problem it finds, so a salary typed on step 1 surfaced on step 4 as a toast
 * full of JSON, after the candidate believed they were finished. There is no
 * validate-only endpoint: the one way to ask is to POST the application and
 * read the rejection.
 *
 * That makes the safety of this route the whole point. A POST Manatal accepts
 * CREATES A REAL APPLICATION, so the payload sent from here is guaranteed to
 * be incomplete: a required field is always withheld, chosen from the field
 * list Manatal itself publishes rather than hardcoded, so this holds even if
 * the form is reconfigured. The withheld field is never reported back, because
 * the candidate did not omit it -- we did.
 */
export async function POST(request: Request) {
  const clientSlug = process.env.MANATAL_CLIENT_SLUG;

  if (!clientSlug) {
    return Response.json({ error: "Client slug not configured" }, { status: 500 });
  }

  let body: { jobId?: string; application_data?: Record<string, unknown> };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { jobId, application_data: applicationData } = body;

  if (!jobId || !applicationData || typeof applicationData !== "object") {
    return Response.json({ error: "jobId and application_data are required" }, { status: 400 });
  }

  const fields = await getJobSectionFields(jobId);

  // Without the field list there is no way to prove the probe is incomplete,
  // and a complete one would file an application. Skip the check instead: the
  // step advances and submission stays the backstop it has always been.
  if (fields.length === 0) {
    return Response.json({ problems: [], checked: false });
  }

  const { probe, withheld } = buildIncompleteProbe(applicationData, fields);

  if (!withheld) {
    // Manatal declares nothing as required, so no probe can be proven to fail.
    return Response.json({ problems: [], checked: false });
  }

  let response: Response;

  try {
    // Through MANATAL_BASE_URL, so a test run is pointed at the stub. Hardcoding
    // the real host here would have the e2e suite POST to production Manatal on
    // every step boundary.
    const baseUrl = process.env.MANATAL_BASE_URL || "https://api.manatal.com/open/v3";

    response = await fetch(
      `${baseUrl}/career-page/${clientSlug}/jobs/${jobId}/application-form/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_data: probe }),
      },
    );
  } catch (error) {
    console.error("Manatal step validation unreachable:", error);
    return Response.json({ problems: [], checked: false });
  }

  const text = await response.text();

  if (response.ok) {
    // Must be unreachable: the payload was missing a required field. If it ever
    // happens, an application was just filed by a validation call.
    console.error("Manatal ACCEPTED a validation probe; withheld field was", withheld, text.slice(0, 500));
    return Response.json({ problems: [], checked: false });
  }

  return Response.json({
    problems: readValueProblems(text, fields),
    checked: true,
  });
}
