import type { MetadataRoute } from "next";

import { absoluteUrl, SITE_URL } from "@/lib/seo";

/**
 * Only the listing and the job pages are worth crawling. The application form
 * is a form, the embed widgets are the same jobs rendered for someone else's
 * page, and the API routes are not pages at all.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/embed/", "/jobs/*/apply"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
