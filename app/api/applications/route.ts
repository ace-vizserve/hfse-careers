// app/api/applications/route.ts

export async function POST(request: Request) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG;

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

    console.log("📝 Processing application for job:", jobId);

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
          { status: 400 }
        );
      }
    }

    console.log(applicationData);

    const getNationalityId = async (nationalityName: string): Promise<number | null> => {
      try {
        const response = await fetch(
          `https://api.manatal.com/open/v3/nationalities/?search=${encodeURIComponent(nationalityName)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            console.log(`✅ Found nationality ID for "${nationalityName}":`, data[0].id);
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

    // Check if field 1742127 (Nationality) needs to be converted
    if (applicationData["1742127"] && typeof applicationData["1742127"] === "string") {
      const nationalityName = applicationData["1742127"];
      const nationalityId = await getNationalityId(nationalityName);
      if (nationalityId) {
        applicationData["1742127"] = String(nationalityId);
      } else {
        return Response.json(
          {
            error: `Nationality "${nationalityName}" not found in Manatal system`,
            details: "Please provide a valid nationality",
          },
          { status: 400 }
        );
      }
    }

    // Format character references as HTML for Manatal
if (applicationData["character_references"] && Array.isArray(applicationData["character_references"])) {
  const references = applicationData["character_references"];
  
  const formattedReferences = references
    .map((ref: any) => `
      <li>
        <ul>
          <li>Name : ${ref.name || ''}</li>
          <li>Email : ${ref.email || ''}</li>
          <li>Contact Number : ${ref.contact_no || ''}</li>
          <li>Occupation & Company : ${ref.company_occupation || ''}</li>
          <li>Relationship to Applicant : ${ref.relationship || ''}</li>
        </ul>
      </li>
    `)
    .join('');
  
  applicationData["character_references"] = `<ol>${formattedReferences}</ol>`;
  console.log("✅ Formatted character references as HTML");
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

    const submitResponse = await fetch(
      `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${jobId}/application-form/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ application_data: applicationData }),
      }
    );

    const submitText = await submitResponse.text();
    console.log("📥 Manatal Response:", submitResponse.status);
    console.log("📥 Response body:", submitText);

    if (!submitResponse.ok) {
      console.error("❌ Manatal API Error:", submitText);
      return Response.json(
        {
          error: "Failed to submit application",
          details: submitText,
          status: submitResponse.status,
        },
        { status: submitResponse.status }
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
        { status: 500 }
      );
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
      { status: 500 }
    );
  }
}
