import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getJob, getJobSectionFields, getPublishedJobs } from "@/lib/jobs.server";

import ApplyClient from "./apply-client";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * The form used to fetch the job and its Manatal field ids from the browser,
 * after hydration, one after the other — three round trips before the first
 * field appeared. Both now resolve on the server, in parallel, from the same
 * cache the job page uses, and the page itself is prerendered: the fields are
 * in the HTML, and React only has to attach to them.
 */
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const jobs = await getPublishedJobs();

  return jobs.filter((job) => job.id).map((job) => ({ id: String(job.id) }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);

  return {
    title: job ? `Apply: ${job.position_name}` : "Apply",
    // An application form has nothing to offer search; the job page is the
    // indexable one and it links here.
    robots: { index: false, follow: true },
  };
}

export default async function JobApplicationPage({ params }: Params) {
  const { id } = await params;

  const [job, sectionFields] = await Promise.all([getJob(id), getJobSectionFields(id)]);

  if (!job) notFound();

  return <ApplyClient job={job} sectionFields={sectionFields} />;
}
