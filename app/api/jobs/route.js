import { entity_list } from "../../constants";

export async function GET() {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;

  if (!MANATAL_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(
      "https://api.manatal.com/open/v3/jobs/?is_published=true&page_size=100&status=active",
      {
        headers: {
          Authorization: `Token ${MANATAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Manatal API error:", response.status, errorText);
      return Response.json(
        {
          error: "Failed to fetch jobs from Manatal",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    const jobs = data.results || [];

    jobs.forEach((job) => {
      const organization = entity_list.find((org) => org.id === job.organization);

      if (organization) {
        job.org_name = organization.name;
        job.org_logo = organization.logo;
        job.org_website = organization.website;
      }
    });

    return Response.json({
      results: jobs.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      }),
      count: jobs.length,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch jobs",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
