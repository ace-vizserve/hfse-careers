import JobsClient from "./jobs-client";

interface Job {
  id?: number;
  position_name?: string;
  title?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  employment_type?: string;
  contract_details?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  frequency?: string;
  is_remote?: boolean | null;
  company?: { name: string };
  requirements?: string[];
  benefits?: string[];
  urgently_hiring?: boolean;
  easily_apply?: boolean;
  org_logo: string;
  org_name: string;
  org_website: string;
}

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
