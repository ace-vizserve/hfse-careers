import { getPublishedJobs } from "@/lib/jobs.server";
import JobsClient from "./jobs-client";

/**
 * The listing is prerendered and refreshed in the background, so the first
 * paint never waits on Manatal.
 */
export const revalidate = 300;

export default async function Page() {
  const jobs = await getPublishedJobs();

  return <JobsClient initialJobs={jobs} />;
}
