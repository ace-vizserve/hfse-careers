// app/api/applications/route.ts

import { normalizeApplicationData } from "@/lib/utils";

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

    const getNationalityId = async (nationalityName: string): Promise<number | null> => {
      try {
        const response = await fetch(
          `https://api.manatal.com/open/v3/nationalities/?search=${encodeURIComponent(nationalityName)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            return data[0].id;
          }
        }
        console.warn(`⚠️ Nationality "${nationalityName}" not found`);
        return null;
      } catch (error) {
        console.error("Error fetching nationality:", error);
        return null;
      }
    };

    // Which key holds the nationality. The page resolves Manatal's ids at
    // request time now, so it sends the one it used rather than leaving this
    // side to assume; the literal is the fallback for a payload without it.
    const nationalityFieldValue = formData.get("nationality_field_id");
    const nationalityField =
      typeof nationalityFieldValue === "string" && nationalityFieldValue ? nationalityFieldValue : "1742127";

    // Check if the Nationality field needs to be converted
    if (applicationData[nationalityField] && typeof applicationData[nationalityField] === "string") {
      const nationalityName = applicationData[nationalityField];
      const nationalityId = await getNationalityId(nationalityName);
      if (nationalityId) {
        applicationData[nationalityField] = String(nationalityId);
      } else {
        return Response.json(
          {
            error: `Nationality "${nationalityName}" not found in Manatal system`,
            details: "Please provide a valid nationality",
          },
          { status: 400 },
        );
      }
    }

    // Get expected_currency from formData
    const expectedCurrencyValue = formData.get("expected_currency");
    const expectedCurrency = typeof expectedCurrencyValue === "string" ? expectedCurrencyValue : null;

    // Add expected_currency directly to application_data at root level
    if (expectedCurrency) {
      applicationData.expected_currency = parseInt(expectedCurrency);
    } else {
      // Default to SGD (ID: 11) if not provided
      applicationData.expected_currency = 11;
    }

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
      return Response.json(
        {
          error: "Failed to submit application",
          details: submitText,
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
