// app/api/applications/route.ts

import { toNationalityId } from "@/lib/forms/nationality";
import type { IssueStage } from "@/lib/submission-issues";
import { findCandidateIdByEmailOrName } from "@/lib/manatal.server";
import { logIssue, logSubmission } from "@/lib/submission-log.server";
import { normalizeApplicationData, readManatalError } from "@/lib/utils";

/** Manatal's currency id for the Singapore dollar (GET /open/v3/currencies/). */
const MANATAL_CURRENCY_SGD = 13;

export async function POST(request: Request) {
  // Filled in once the form data is read, so a failure after that point is
  // logged against its job.
  let jobIdForLog: string | null = null;

  // Every way out that is not a submission goes through here, so the issue log
  // sees exactly what the candidate was told.
  const fail = async (stage: IssueStage, status: number, body: Record<string, unknown>, error?: string) => {
    await logIssue(request, {
      stage,
      outcome: "failed",
      jobId: jobIdForLog,
      httpStatus: status,
      error: error ?? String(body.error ?? ""),
    });
    return Response.json(body, { status });
  };

  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG;

  const WEBHOOK_URL = process.env.N8N_PROD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    return fail("config", 500, { error: "Webhook URL not configured" });
  }

  if (!MANATAL_API_KEY) {
    return fail("config", 500, { error: "API key not configured" });
  }

  if (!MANATAL_CLIENT_SLUG) {
    return fail("config", 500, { error: "Client slug not configured" });
  }

  try {
    const formData = await request.formData();
    const jobId = formData.get("jobId");

    if (!jobId) {
      return fail("payload", 400, { error: "Job ID is required" });
    }

    jobIdForLog = String(jobId);

    const applicationDataStr = formData.get("application_data");
    if (!applicationDataStr || typeof applicationDataStr !== "string") {
      return fail("payload", 400, { error: "Application data is required" });
    }

    let applicationData: Record<string, any>;
    try {
      applicationData = JSON.parse(applicationDataStr);
    } catch (e) {
      return fail("payload", 400, { error: "Invalid application data format" });
    }

    if (applicationData["1741683"]) {
      const resume = applicationData["1741683"];
      if (resume) {
        applicationData["1741683"] = String(resume);
      } else {
        return fail("payload", 400, {
          error: `Resume: "${resume}" not found in Manatal system`,
          details: "Please provide a valid nationality",
        });
      }
    }

    // Which key holds the nationality. The page resolves Manatal's ids at
    // request time now, so it sends the one it used rather than leaving this
    // side to assume; the literal is the fallback for a payload without it.
    const nationalityFieldValue = formData.get("nationality_field_id");
    const nationalityField =
      typeof nationalityFieldValue === "string" && nationalityFieldValue ? nationalityFieldValue : "1742127";

    // The page sends Manatal's id. This used to search Manatal for a demonym
    // and take the first hit, which filed some candidates under the wrong
    // country; see toNationalityId. A value that is neither an id nor a
    // demonym only one country carries is refused rather than guessed at.
    if (applicationData[nationalityField]) {
      const nationalityId = toNationalityId(applicationData[nationalityField]);

      if (!nationalityId) {
        return fail("nationality", 400, {
          error: "Nationality could not be recognised",
          details: "Please choose your nationality again on the first step, then submit.",
        });
      }

      applicationData[nationalityField] = nationalityId;
    }

    // The form takes salary in SGD only -- the input carries a fixed SGD
    // prefix -- so the currency is set here rather than sent by the page. The
    // old fallback here was 11, commented as SGD; in Manatal's list 11 is the
    // Philippine peso.
    applicationData.expected_currency = MANATAL_CURRENCY_SGD;

    const { job_id, job_portal, referrer_email, referrer_name, organization_name, position_name, ...appData } =
      applicationData;

    const submitResponse = await fetch(
      `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_data: normalizeApplicationData(appData) }),
      },
    );

    const submitText = await submitResponse.text();

    if (!submitResponse.ok) {
      // The raw body used to go straight to the candidate, who got a toast full
      // of JSON. It still belongs in the server log, where it is useful.
      console.error("Manatal application submit failed:", submitResponse.status, submitText);

      const manatalMessage = readManatalError(submitText);

      // Manatal's own words go in the log, not its raw body: the body can
      // repeat back what the candidate typed.
      return fail(
        "manatal",
        submitResponse.status,
        {
          error: "Failed to submit application",
          details: manatalMessage ?? "Please try again. If the problem continues, contact us before re-submitting.",
          status: submitResponse.status,
        },
        manatalMessage ?? `Manatal returned ${submitResponse.status}`,
      );
    }

    let result;
    try {
      result = JSON.parse(submitText);
    } catch (e) {
      console.error("Failed to parse Manatal response:", submitText);
      return fail(
        "manatal",
        500,
        { error: "Invalid response from Manatal", details: submitText },
        "Manatal's reply was not JSON",
      );
    }

    // The candidate already exists in Manatal at this point. The webhook is a
    // notification side effect, so a failure here is logged but never reported
    // to the applicant as a failed submission.
    try {
      const submitDataToWebhook = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          application_data: {
            job_id,
            job_portal,
            referrer_email,
            referrer_name,
            candidate_name: appData["1741679"],
            candidate_email: appData["1741680"],
            organization_name,
            position_name,
          },
        }),
      });

      if (!submitDataToWebhook.ok) {
        const submitDataToWebhookText = await submitDataToWebhook.text();
        console.error(
          `Notification webhook failed (${submitDataToWebhook.status}) for candidate ${result.id}:`,
          submitDataToWebhookText,
        );
      }
    } catch (webhookError) {
      console.error(`Notification webhook threw for candidate ${result.id}:`, webhookError);
    }

    // The career-page endpoint's reply carries no candidate id, so every log
    // row was written with a null one. Look the candidate up instead; the log
    // is best-effort, so a lookup that fails still writes the row.
    let candidateId: number | string | null = result?.id ?? null;
    if (candidateId == null) {
      try {
        candidateId = await findCandidateIdByEmailOrName({
          email: String(appData["1741680"] ?? ""),
          fullName: String(appData["1741679"] ?? ""),
        });
      } catch (lookupError) {
        console.error("Could not look up the new candidate's id for the submission log:", lookupError);
      }
    }

    await logSubmission(request, {
      candidateId,
      jobId: String(jobId),
      positionName: typeof position_name === "string" ? position_name : null,
    });

    return Response.json({
      success: true,
      candidateId,
      message: "Application submitted successfully with resume",
    });
  } catch (error) {
    console.error("❌ Application submission error:", error);
    return fail(
      "submit",
      500,
      { error: "Failed to submit application", message: (error as Error).message },
      `${(error as Error).name}: ${(error as Error).message}`,
    );
  }
}
