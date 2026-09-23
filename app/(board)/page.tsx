import type { Metadata } from "next";

import { getPublishedJobs } from "@/lib/jobs.server";
import { absoluteUrl, jsonLdScript, OG_IMAGE, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo";

/**
 * The listing is prerendered and refreshed in the background, so the first
 * paint never waits on Manatal.
 */
export const revalidate = 300;

const DESCRIPTION =
  "Browse every open role at HFSE Global Education Group: teaching, school operations and education support positions across Singapore. Apply online in minutes.";

export const metadata: Metadata = {
  // Absolute, because the site title already reads as a whole title; the
  // layout's template would otherwise append "| HFSE Careers" a second time.
  title: { absolute: SITE_TITLE },
  description: DESCRIPTION,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: SITE_TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_SG",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "HFSE Global Education Group careers" }],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default async function Page() {
  const jobs = await getPublishedJobs();

  /**
   * A listing page's job is to point at the postings. Each entry carries little
   * more than its url, which is what Google reads here -- a posting's details
   * are stated once, in the JobPosting on the page this links to.
   */
  const jobListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#listings`,
    url: SITE_URL,
    name: SITE_TITLE,
    description: DESCRIPTION,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: jobs.length,
      itemListElement: jobs
        .filter((job) => job.id)
        .map((job, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: job.position_name,
          url: absoluteUrl(`/jobs/${job.id}`),
        })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jobListJsonLd)} />

    </>
  );
}
