import { hasAlreadyAppliedToJob } from "@/lib/manatal.server";

export async function POST(request: Request) {
  try {
    const { jobPk, email, fullName } = await request.json();

    const parsedJobPk = Number(jobPk);

    if (!Number.isFinite(parsedJobPk)) {
      return Response.json({ error: "A valid jobPk is required" }, { status: 400 });
    }

    const result = await hasAlreadyAppliedToJob({
      jobPk: parsedJobPk,
      email: typeof email === "string" ? email : undefined,
      fullName: typeof fullName === "string" ? fullName : undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Duplicate application check failed:", error);
    return Response.json(
      {
        error: "Failed to check for an existing application",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
