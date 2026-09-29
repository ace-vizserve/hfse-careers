import { hasAlreadyAppliedToJob } from "@/lib/manatal.server";
import { logIssue } from "@/lib/submission-log.server";

export async function POST(request: Request) {
  let jobIdForLog: string | null = null;

  try {
    const { jobPk, email, fullName } = await request.json();

    const parsedJobPk = Number(jobPk);

    if (!Number.isFinite(parsedJobPk)) {
      await logIssue(request, {
        stage: "duplicate_check",
        outcome: "failed",
        jobId: null,
        httpStatus: 400,
        error: "A valid jobPk is required",
      });
      return Response.json({ error: "A valid jobPk is required" }, { status: 400 });
    }

    jobIdForLog = String(parsedJobPk);

    const result = await hasAlreadyAppliedToJob({
      jobPk: parsedJobPk,
      email: typeof email === "string" ? email : undefined,
      fullName: typeof fullName === "string" ? fullName : undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("Duplicate application check failed:", error);
    await logIssue(request, {
      stage: "duplicate_check",
      outcome: "failed",
      jobId: jobIdForLog,
      httpStatus: 500,
      error: `${(error as Error).name}: ${(error as Error).message}`,
    });
    return Response.json(
      {
        error: "Failed to check for an existing application",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
