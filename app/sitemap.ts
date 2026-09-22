import type { MetadataRoute } from "next";

import { getPublishedJobs } from "@/lib/jobs.server";
import { absoluteUrl } from "@/lib/seo";

/**
 * Rebuilt on the same schedule as the listing, so a role published today is
 * submitted to search engines today rather than at the next deploy.
 */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const jobs = await getPublishedJobs();

  const listing: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // A posting that has been taken down simply stops appearing here, which is
  // what tells a crawler to drop it.
  const postings: MetadataRoute.Sitemap = jobs
    .filter((job) => job.id)
    .map((job) => ({
      url: absoluteUrl(`/jobs/${job.id}`),
      lastModified: job.created_at ? new Date(job.created_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [...listing, ...postings];
}
