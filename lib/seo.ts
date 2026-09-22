/**
 * The handful of values every page's metadata and structured data agree on.
 * Kept here so a canonical, an Open Graph url and a sitemap entry can never
 * drift apart.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://careers.hfse.edu.sg";

/** The legal entity doing the hiring, as it should read in search results. */
export const SITE_NAME = "HFSE Global Education Group";

export const SITE_TITLE = "HFSE Careers | Education Jobs in Singapore";

export const OG_IMAGE = "/assets/career-opportunities.jpg";

/** JSON-LD wants absolute urls; Next's metadata resolves relative ones itself. */
export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

/**
 * Who runs this site, stated once in the root layout. The `@id`s let a page's
 * own structured data point back here instead of repeating the organisation.
 */
export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: "https://hfse.edu.sg/",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/assets/geg-logo-transparent.png"),
      },
      sameAs: ["https://hfse.edu.sg/"],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "HFSE Careers",
      url: SITE_URL,
      inLanguage: "en-SG",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

/** One `<script type="application/ld+json">`, escaped the way Next expects. */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data) };
}
