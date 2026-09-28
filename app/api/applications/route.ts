// app/api/applications/route.ts

import Bowser from "bowser";

import { toNationalityId } from "@/lib/forms/nationality";
import { normalizeApplicationData, readManatalError } from "@/lib/utils";

/** Manatal's currency id for the Singapore dollar (GET /open/v3/currencies/). */
const MANATAL_CURRENCY_SGD = 13;

/**
 * The browser the candidate submitted from, for the notification webhook only.
 * It stays out of Manatal so it never lands on the candidate record. The raw
 * string goes along too, since browsers now trim it and the parse can miss.
 */
function readBrowser(request: Request) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent) return { browser: null, os: null, device: null, user_agent: null };

  const parsed = Bowser.parse(userAgent);
  const label = (name?: string, version?: string) => (name ? [name, version].filter(Boolean).join(" ") : null);

  return {
    browser: label(parsed.browser.name, parsed.browser.version),
    os: label(parsed.os.name, parsed.os.versionName ?? parsed.os.version),
    device: parsed.platform.type ?? null,
    user_agent: userAgent,
  };
}

export async function POST(request: Request) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG;

  const WEBHOOK_URL = process.env.N8N_PROD_WEBHOOK_URL;

  if (!WEBHOOK_URL) {
    return Response.json({ error: "Webhook URL not configured" }, { status: 500 });
  }

  if (!MANATAL_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  if (!MANATAL_CLIENT_SLUG) {
    return Response.json({ error: "Client slug not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const jobId = formData.get("jobId");

    if (!jobId) {
      return Response.json({ error: "Job ID is required" }, { status: 400 });
    }

    const applicationDataStr = formData.get("application_data");
    if (!applicationDataStr || typeof applicationDataStr !== "string") {
      return Response.json({ error: "Application data is required" }, { status: 400 });
    }

    let applicationData: Record<string, any>;
    try {
      applicationData = JSON.parse(applicationDataStr);
    } catch (e) {
      return Response.json({ error: "Invalid application data format" }, { status: 400 });
    }

    if (applicationData["1741683"]) {
      const resume = applicationData["1741683"];
      if (resume) {
        applicationData["1741683"] = String(resume);
      } else {
        return Response.json(
          {
            error: `Resume: "${resume}" not found in Manatal system`,
            details: "Please provide a valid nationality",
          },
          { status: 400 },
        );
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
        return Response.json(
          {
            error: "Nationality could not be recognised",
            details: "Please choose your nationality again on the first step, then submit.",
          },
          { status: 400 },
        );
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

      return Response.json(
        {
          error: "Failed to submit application",
          details:
            readManatalError(submitText) ??
            "Please try again. If the problem continues, contact us before re-submitting.",
          status: submitResponse.status,
        },
        { status: submitResponse.status },
      );
    }

    let result;
    try {
      result = JSON.parse(submitText);
    } catch (e) {
      console.error("Failed to parse Manatal response:", submitText);
      return Response.json(
        {
          error: "Invalid response from Manatal",
          details: submitText,
        },
        { status: 500 },
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
            ...readBrowser(request),
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

    return Response.json({
      success: true,
      candidateId: result.id,
      message: "Application submitted successfully with resume",
    });
  } catch (error) {
    console.error("❌ Application submission error:", error);
    return Response.json(
      {
        error: "Failed to submit application",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
