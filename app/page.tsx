import type { Job } from "@/lib/types/job";
import JobsClient from "./jobs-client";

async function getJobs(): Promise<Job[]> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://careers.hfse.edu.sg";

  const response = await fetch(`${baseUrl}/api/jobs`, {
    next: { revalidate: 300 },
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  const data = await response.json();

  if (Array.isArray(data)) return data;
  if (data.results && Array.isArray(data.results)) return data.results;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.jobs && Array.isArray(data.jobs)) return data.jobs;

  return [];
}

export default async function Page() {
  const jobs = await getJobs();

  return <JobsClient initialJobs={jobs} />;
}
