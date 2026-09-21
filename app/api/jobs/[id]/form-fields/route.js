// app/api/jobs/[id]/form-fields/route.js

export async function GET(request, { params }) {
  const MANATAL_API_KEY = process.env.MANATAL_API_KEY;
  const MANATAL_CLIENT_SLUG = process.env.MANATAL_CLIENT_SLUG;
  const { id } = await params;

  if (!MANATAL_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  if (!MANATAL_CLIENT_SLUG) {
    return Response.json({ error: "Client slug not configured" }, { status: 500 });
  }

  try {
    // Fetch application form fields from Career Page API
    const response = await fetch(
      `https://api.manatal.com/open/v3/career-page/${MANATAL_CLIENT_SLUG}/jobs/${id}/application-form/`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch form fields:", errorText);
      throw new Error("Failed to fetch form fields");
    }

    const formFields = await response.json();

    // Transform Manatal fields to our format and filter out Character References
    const transformedFields = formFields
      .filter((field) => {
        const slug = field.slug?.toLowerCase() || "";
        const label = field.label?.toLowerCase() || "";

        const isCharacterRef =
          slug.includes("character") || slug.includes("reference") || label.includes("character reference");

        const isDeclaration = slug === "declaration" || label === "declaration";

        const isBC = slug.includes("skipbackgroundcheck");

        const isRCBCIssued = slug.includes("rcbcrequestissued");

        const isBCIssued = slug.includes("bcrequestissued");

        const isFamilyParticulars = slug.includes("familyparticulars");

        return !isCharacterRef && !isDeclaration && !isBC && !isRCBCIssued && !isBCIssued && !isFamilyParticulars;
      })
      .map((field) => ({
        id: field.id,
        name: field.slug,
        label: field.label,
        type: mapFieldType(field.type, field.display_type),
        required: field.is_required,
        options: field.options || [],
        placeholder: generatePlaceholder(field.label, field.type),
        fieldCategory: field.field_category,
      }));

    return Response.json({
      fields: transformedFields,
      jobId: id,
    });
  } catch (error) {
    console.error("Error fetching form fields:", error);
    return Response.json(
      {
        error: "Failed to fetch form fields",
        message: error.message,
      },
      { status: 500 },
    );
  }
}

// Map Manatal field types to HTML input types
function mapFieldType(manatalType, displayType) {
  if (displayType === "file") return "file";
  if (displayType === "textarea") return "textarea";
  if (displayType === "select") return "select";
  if (displayType === "multiselect") return "select";

  const typeMap = {
    email: "email",
    phone: "tel",
    url: "url",
    date: "date",
    number: "number",
    char: "text",
    text: "textarea",
  };

  return typeMap[manatalType] || "text";
}

// Generate helpful placeholders
function generatePlaceholder(label, type) {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes("email")) return "john@example.com";
  if (lowerLabel.includes("phone")) return "+1234567890";
  if (lowerLabel.includes("linkedin")) return "https://linkedin.com/in/yourprofile";
  if (lowerLabel.includes("name")) return "John Doe";
  if (lowerLabel.includes("cover")) return "Tell us why you're a great fit...";
  if (type === "date") return "YYYY-MM-DD";

  return "";
}
