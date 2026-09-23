import JobDetailPane from "@/components/job-detail-pane";
import { getPublishedJobs } from "@/lib/jobs.server";
import { notFound } from "next/navigation";

/**
 * `/jobs/[id]` as seen from the board: intercepted, so it renders into the
 * column beside the listing instead of replacing the page.
 *
 * The job is resolved out of the published listing rather than through
 * `getJob`, for two reasons. That list is already cached for this layout, so a
 * click costs no round-trip. And `getJob` returns a `JobDetail`, which does not
 * carry `urgently_hiring`, `requirements` or `benefits` — all of which this
 * pane shows.
 */
export default async function InterceptedJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = (await getPublishedJobs()).find((entry) => String(entry.id) === id);

  if (!job) notFound();

  return <JobDetailPane job={job} />;
}
