import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Toaster } from "sileo";
import "./globals.css";

// Load Roboto font
const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://careers.hfse.edu.sg"),

  title: "HFSE Careers | Education Jobs in Singapore",
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

  alternates: {
    canonical: "/",
  },

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
    title: "HFSE Careers | Education Jobs in Singapore",
    description:
      "Apply for career opportunities at HFSE Global Education Group and join a growing education team in Singapore.",
    url: "/",
    siteName: "HFSE Global Education Group",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/assets/career-opportunities.jpg",
        width: 1200,
        height: 630,
        alt: "HFSE Global Education Group careers",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "HFSE Careers | Education Jobs in Singapore",
    description:
      "Explore HFSE career opportunities and apply online for education and school-based roles in Singapore.",
    images: ["/assets/career-opportunities.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`} style={{ fontFamily: "var(--font-roboto)" }}>
        <Toaster position="top-right" theme="light" />
        {children}
      </body>
    </html>
  );
}
