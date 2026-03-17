// app/api/jobs/[id]/route.js

export async function GET(request, { params }) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;
  const { id } = params;

  if (!MANATAL_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.manatal.com/open/v3/jobs/${id}/`, {
      headers: {
        Authorization: `Token ${MANATAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Disable caching for fresh data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Manatal API error:", response.status, errorText);
      return Response.json(
        {
          error: "Failed to fetch job details",
          details: errorText,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        error: "Failed to fetch job details",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
