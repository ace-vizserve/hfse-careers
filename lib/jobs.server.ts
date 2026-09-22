/**
 * Server-side job lookups.
 *
 * Pages used to reach Manatal by fetching this app's own `/api/jobs` routes
 * through the public site URL — a full DNS/TLS round trip back into ourselves
 * before the real upstream call even started. These talk to Manatal directly
 * and let the Next data cache hold the result, so a rendered page costs one
 * upstream request per revalidation window instead of one per visitor.
 */

import { entity_list } from "@/app/constants";
import type { Job, JobDetail } from "@/lib/types/job";

// Overridable so the e2e run can point at a stub upstream instead of the real ATS.
const MANATAL_BASE_URL = process.env.MANATAL_BASE_URL || "https://api.manatal.com/open/v3";

/** How long a cached job list or job stays fresh, in seconds. */
export const JOBS_REVALIDATE = 300;

/** Cache tags, so a webhook can drop just the jobs it touched. */
export const JOBS_TAG = "jobs";
export const jobTag = (id: string | number) => `job:${id}`;

type ManatalListResponse<T> = { results?: T[]; count?: number };

async function manatalFetch<T>(path: string, tags: string[]): Promise<Response | null> {
  const apiKey = process.env.MANATAL_API_KEY;

  if (!apiKey) {
    console.error("MANATAL_API_KEY is not configured");
    return null;
  }

  return fetch(`${MANATAL_BASE_URL}${path}`, {
    headers: {
      Authorization: `Token ${apiKey}`,
      Accept: "application/json",
    },
    next: { revalidate: JOBS_REVALIDATE, tags },
  }) as Promise<Response>;
}

/** Attach the owning entity's name, logo and site, which Manatal does not return. */
function withOrganization<T extends { organization?: number }>(job: T) {
  const organization = entity_list.find((org) => org.id === job.organization);

  if (!organization) return job;

  return {
    ...job,
    org_name: organization.name,
    org_logo: organization.logo,
    org_website: organization.website,
  };
}

/** Every published, active job, newest first. Returns [] rather than throwing. */
export async function getPublishedJobs(): Promise<Job[]> {
  try {
    const res = await manatalFetch("/jobs/?is_published=true&page_size=100&status=active", [JOBS_TAG]);

    if (!res?.ok) {
      console.error("Manatal jobs list failed:", res?.status, await res?.text());
      return [];
    }

    const data: ManatalListResponse<Job & { created_at?: string }> = await res.json();
    const jobs = data.results ?? [];

    return jobs
      .map(withOrganization)
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()) as Job[];
  } catch (error) {
    console.error("Manatal jobs list error:", error);
    return [];
  }
}

/** A single job, or null when Manatal says it is gone. */
export async function getJob(id: string | number): Promise<JobDetail | null> {
  try {
    const res = await manatalFetch(`/jobs/${id}/`, [JOBS_TAG, jobTag(id)]);

    if (res?.status === 404) return null;

    if (!res?.ok) {
      console.error("Manatal job fetch failed:", res?.status, await res?.text());
      return null;
    }

    const job: JobDetail = await res.json();

    return withOrganization(job) as JobDetail;
  } catch (error) {
    console.error("Manatal job fetch error:", error);
    return null;
  }
}

export type JobSectionField = { id: string | number; name?: string; label?: string };

/**
 * The job's Manatal application form. The apply page renders its own fields and
 * only consults this for the education and experience section ids, so the
 * response is reduced to those three keys.
 */
export async function getJobSectionFields(id: string | number): Promise<JobSectionField[]> {
  const clientSlug = process.env.MANATAL_CLIENT_SLUG;

  if (!clientSlug) {
    console.error("MANATAL_CLIENT_SLUG is not configured");
    return [];
  }

  try {
    const res = await fetch(`${MANATAL_BASE_URL}/career-page/${clientSlug}/jobs/${id}/application-form/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: JOBS_REVALIDATE, tags: [JOBS_TAG, jobTag(id)] },
    });

    if (!res.ok) {
      console.error("Manatal application-form fetch failed:", res.status, await res.text());
      return [];
    }

    const fields: { id: string | number; slug?: string; label?: string }[] = await res.json();

    if (!Array.isArray(fields)) return [];

    return fields.map((field) => ({ id: field.id, name: field.slug, label: field.label }));
  } catch (error) {
    console.error("Manatal application-form error:", error);
    return [];
  }
}
