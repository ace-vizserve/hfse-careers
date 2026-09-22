import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sileo";

import { PdpaNotice } from "@/components/ui/pdpa-notice";
import { jsonLdScript, OG_IMAGE, SITE_NAME, SITE_TITLE, SITE_URL, siteJsonLd } from "@/lib/seo";
import "./globals.css";

// Poppins is the brand face; it already ships in the hero widget.
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  /**
   * A page sets only its own name and inherits the suffix from here. Anything
   * that has to stand alone, like the listings page, passes `title: { absolute }`.
   */
  title: {
    default: SITE_TITLE,
    template: "%s | HFSE Careers",
  },

  description:
    "Explore career opportunities at HFSE Global Education Group. Apply online for teaching, school operations, and education support roles in Singapore.",

  keywords: [
    "HFSE careers",
    "HFSE Global Education Group jobs",
    "education jobs Singapore",
    "teaching jobs Singapore",
    "school careers Singapore",
    "HFSE recruitment",
  ],

  /**
   * Deliberately no `alternates.canonical` here. A canonical set on the layout
   * is inherited by every page that does not override it, which pointed the
   * apply form and both embed widgets at the homepage -- telling Google those
   * pages *are* the homepage. Each indexable page states its own instead.
   */

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/assets/geg-favicon.png",
    shortcut: "/assets/geg-favicon.png",
    apple: "/assets/geg-favicon.png",
  },

  openGraph: {
    title: SITE_TITLE,
    description:
      "Apply for career opportunities at HFSE Global Education Group and join a growing education team in Singapore.",
    url: "/",
    siteName: SITE_NAME,
    locale: "en_SG",
    type: "website",
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "HFSE Global Education Group careers",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description:
      "Explore HFSE career opportunities and apply online for education and school-based roles in Singapore.",
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`} style={{ fontFamily: "var(--font-poppins)" }}>
        {/* Who runs this site. Stated once here, referenced by each page's own JSON-LD. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(siteJsonLd)} />

        <Toaster position="top-right" theme="light" />
        {children}
        <PdpaNotice />
      </body>
    </html>
  );
}
